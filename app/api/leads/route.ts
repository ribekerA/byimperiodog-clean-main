export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { erroPublico, registrarErro } from "@/lib/apiErro";
import { sendLeadAutoResponse } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Schema de validação server-side alinhado com o funil de leads (contato + contexto + LGPD).
//
// Os `max()` entraram nesta rodada. Sem eles, `nome`, `telefone` e `mensagem`
// aceitavam string de qualquer tamanho: dava para gravar megabytes por POST na
// tabela de leads, e a tabela de leads é o que o canil abre todo dia.
const leadSchema = z.object({
  nome: z.string().min(2).max(120),
  telefone: z.string().min(10).max(24),
  // Cidade e estado eram obrigatórios aqui, mas são opcionais no formulário e
  // nulláveis na tabela — e o chat do matchmaker e a fila de espera nem chegam
  // a coletá-los. Na prática esses dois canais recebiam 400 e nenhum lead deles
  // era salvo. Continua aceitando o valor quando ele vem preenchido.
  cidade: z.string().trim().min(2).max(120).nullish().or(z.literal("")),
  estado: z.string().trim().length(2).toUpperCase().nullish().or(z.literal("")),
  sexo_preferido: z.enum(["macho", "femea", "tanto_faz"]).optional(),
  cor_preferida: z.string().max(60).optional(),
  prazo_aquisicao: z.enum(["imediato", "1_mes", "2_3_meses", "3_mais"]).optional(),
  mensagem: z.string().max(2000).optional(),
  // nullish e não optional: os clientes mandam getClickId(), que devolve null
  // quando a visita não veio de anúncio. Exigir string faria a validação
  // rejeitar o lead inteiro por causa de um campo de atribuição.
  gclid: z.string().trim().max(2048).nullish(),
  consent_lgpd: z.boolean(),
  consent_version: z.string().max(20).default("1.0"),
  consent_timestamp: z.string().max(40).optional(),
  // Contexto opcional de página
  page_type: z.string().max(60).optional(),
  page_slug: z.string().max(200).optional(),
  page_color: z.string().max(60).optional(),
  page_city: z.string().max(120).optional(),
  page_intent: z.string().max(60).optional(),
});

// Corpo máximo aceito. O formulário mais cheio não passa de ~2 KB; 16 KB dá
// folga para UTMs longas e ainda impede que alguém empurre um JSON de 10 MB
// para dentro da função.
const LIMITE_CORPO_BYTES = 16 * 1024;

// Primeira camada: contagem em memória. É rápida e barata, mas em serverless
// cada instância tem o seu Map — quem distribui as requisições ganha uma janela
// nova a cada cold start. Por isso ela deixou de ser a única (ver
// `excedeuLimitePersistido`).
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 60 segundos
const MAX_REQUESTS = 3;

// Segunda camada: contagem no banco, que é global para todas as instâncias.
// Os números são folgados de propósito — um casal decidindo junto pode mandar
// dois ou três formulários da mesma casa, e perder lead legítimo custa mais
// caro que aguentar alguns POSTs a mais.
const JANELA_CURTA_MS = 60_000;
const MAX_CURTO = 5;
const JANELA_DIARIA_MS = 24 * 60 * 60 * 1000;
const MAX_DIARIO = 40;

// Janela de deduplicação da automação de IA. O insert continua acontecendo (um
// reenvio pode trazer dado corrigido), mas a sequência de vendas com IA — que
// custa crédito por lead — só dispara uma vez por telefone dentro dela.
const JANELA_DEDUP_IA_MS = 30 * 60_000;

function textoDoCorpo(valor: unknown): string | null {
  return typeof valor === "string" && valor.length > 0 && valor.length <= 500 ? valor : null;
}

type ClienteSupabase = ReturnType<typeof supabaseAdmin>;

async function contarLeads(sb: ClienteSupabase, coluna: string, valor: string, desdeMs: number) {
  const desde = new Date(Date.now() - desdeMs).toISOString();
  const { count, error } = await sb
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq(coluna, valor)
    .gte("created_at", desde);
  if (error) throw error;
  return count ?? 0;
}

/** Limite que não depende da memória da instância. Se a consulta falhar, cai
 *  para a camada em memória (que já rodou) em vez de recusar o lead: derrubar
 *  o formulário porque o banco piscou seria pior que o risco que ela cobre. */
async function excedeuLimitePersistido(sb: ClienteSupabase, ip: string): Promise<boolean> {
  if (!ip || ip === "unknown") return false;
  try {
    const [curto, diario] = await Promise.all([
      contarLeads(sb, "ip_address", ip, JANELA_CURTA_MS),
      contarLeads(sb, "ip_address", ip, JANELA_DIARIA_MS),
    ]);
    return curto >= MAX_CURTO || diario >= MAX_DIARIO;
  } catch (erro) {
    registrarErro("api/leads:limite-persistido", erro);
    return false;
  }
}

/** O lead recém-inserido já conta, então > 1 significa que este telefone já
 *  tinha passado por aqui na última meia hora. */
async function telefoneJaAtendidoRecentemente(sb: ClienteSupabase, telefone: string): Promise<boolean> {
  try {
    return (await contarLeads(sb, "telefone", telefone, JANELA_DEDUP_IA_MS)) > 1;
  } catch (erro) {
    registrarErro("api/leads:dedup-ia", erro);
    return false;
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitMap.entries()) {
      const valid = value.filter((t) => now - t < RATE_LIMIT_WINDOW);
      if (valid.length === 0) rateLimitMap.delete(key);
      else rateLimitMap.set(key, valid);
    }
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Muitas requisições. Aguarde 1 minuto e tente novamente." }, { status: 429 });
    }

    // Lê como texto para poder medir antes de desserializar: `req.json()` já
    // teria alocado o objeto inteiro na memória da função.
    const corpoCru = await req.text();
    if (corpoCru.length > LIMITE_CORPO_BYTES) {
      return NextResponse.json({ error: "Envio grande demais." }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(corpoCru) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    if (await excedeuLimitePersistido(sb, ip)) {
      return NextResponse.json({ error: "Muitas requisições. Aguarde 1 minuto e tente novamente." }, { status: 429 });
    }

    const validation = leadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validation.error.errors }, { status: 400 });
    }

    const data = validation.data;
    const url = new URL(req.url);

    // UTM params (query tem precedência, fallback no body). `textoDoCorpo`
    // existe porque o corpo agora é lido como Record<string, unknown>: só passa
    // adiante o que de fato veio como string.
    const utm_source = url.searchParams.get("utm_source") ?? textoDoCorpo(body.utm_source);
    const utm_medium = url.searchParams.get("utm_medium") ?? textoDoCorpo(body.utm_medium);
    const utm_campaign = url.searchParams.get("utm_campaign") ?? textoDoCorpo(body.utm_campaign);
    const utm_content = url.searchParams.get("utm_content") ?? textoDoCorpo(body.utm_content);
    const utm_term = url.searchParams.get("utm_term") ?? textoDoCorpo(body.utm_term);

    const { data: inserted, error } = await sb
      .from("leads")
      .insert({
        nome: data.nome,
        telefone: data.telefone,
        cidade: data.cidade || null,
        estado: data.estado || null,
        sexo_preferido: data.sexo_preferido ?? null,
        cor_preferida: data.cor_preferida ?? null,
        prazo_aquisicao: data.prazo_aquisicao ?? null,
        mensagem: data.mensagem ?? null,
        consent_lgpd: data.consent_lgpd,
        consent_version: data.consent_version,
        consent_timestamp: data.consent_timestamp ?? new Date().toISOString(),
        // Contexto
        page: url.pathname,
        page_type: data.page_type ?? null,
        page_slug: data.page_slug ?? null,
        page_color: data.page_color ?? null,
        page_city: data.page_city ?? null,
        page_intent: data.page_intent ?? null,
        referer: req.headers.get("referer"),
        // O formulário envia o click id persistido no navegador; a query fica
        // como fallback para integrações que chamam a API diretamente.
        gclid: data.gclid || url.searchParams.get("gclid"),
        fbclid: url.searchParams.get("fbclid"),
        ip_address: ip,
        user_agent: req.headers.get("user-agent"),
        // UTMs
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        source: utm_source || "site_org",
        status: "novo",
      })
      .select("id")
      .single();

    if (error) {
      // O texto do Postgres chegava a quem enviava o formulario -- nome de
      // tabela, nome de coluna e texto de constraint, de graca.
      return erroPublico("api/leads", error, 400);
    }

    // ── Automação pós-captura (fire-and-forget, nunca bloqueia a resposta) ──
    if (inserted?.id) {
      const leadId = inserted.id;

      // 1. Dispara sequência AutoSales (análise de IA + agendamento de follow-ups).
      //
      // Só dispara uma vez por telefone a cada meia hora. Antes, cada POST
      // aceito abria uma sequência nova: reenviar o mesmo formulário vinte
      // vezes gerava vinte análises de IA, todas pagas.
      const isWaitlist = data.page_type === "notify_me";
      if (!isWaitlist && !(await telefoneJaAtendidoRecentemente(sb, data.telefone))) {
        import("@/lib/ai/autoSalesEngine")
          .then(({ createAutoSalesSequence }) => createAutoSalesSequence(leadId))
          .catch((err) => console.error("[API /leads] autoSales:", err));
      }

      // 2. E-mail automático de confirmação (requer RESEND_API_KEY + email no body)
      const emailAddr = (body as { email?: string }).email ?? null;
      if (emailAddr) {
        sendLeadAutoResponse({
          name:  data.nome,
          phone: data.telefone,
          city:  data.cidade,
          color: data.cor_preferida ?? null,
          sex:   data.sexo_preferido ?? null,
          email: emailAddr,
        }).catch(() => {});
      }
    }

    // O id volta para o cliente porque é ele que vira transaction_id na
    // conversão do Google Ads: com um id estável por lead, o Ads descarta o
    // disparo repetido quando a mesma pessoa passa por mais de um caminho.
    return NextResponse.json({ ok: true, id: inserted?.id ?? null });
  } catch (e: unknown) {
    return erroPublico("api/leads", e);
  }
}
