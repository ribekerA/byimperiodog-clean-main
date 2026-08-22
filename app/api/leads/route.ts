export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sendLeadAutoResponse } from "@/lib/email";
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  readIdempotencyKey,
  releaseIdempotentRequest,
} from "@/lib/idempotency";
import { rateLimitRequest, tooManyRequests } from "@/lib/rateLimitDurable";
import { RequestBodyError, readJsonWithLimit } from "@/lib/requestGuards";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Schema de validação server-side alinhado com o funil de leads (contato + contexto + LGPD)
const leadSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().min(10).max(30),
  // Cidade e estado eram obrigatórios aqui, mas são opcionais no formulário e
  // nulláveis na tabela — e o chat do matchmaker e a fila de espera nem chegam
  // a coletá-los. Na prática esses dois canais recebiam 400 e nenhum lead deles
  // era salvo. Continua aceitando o valor quando ele vem preenchido.
  cidade: z.string().trim().min(2).max(120).nullish().or(z.literal("")),
  estado: z.string().trim().length(2).toUpperCase().nullish().or(z.literal("")),
  sexo_preferido: z.enum(["macho", "femea", "tanto_faz"]).optional(),
  cor_preferida: z.string().trim().max(80).optional(),
  prazo_aquisicao: z.enum(["imediato", "1_mes", "2_3_meses", "3_mais"]).optional(),
  mensagem: z.string().trim().max(2_000).optional(),
  // nullish e não optional: os clientes mandam getClickId(), que devolve null
  // quando a visita não veio de anúncio. Exigir string faria a validação
  // rejeitar o lead inteiro por causa de um campo de atribuição.
  gclid: z.string().trim().max(2048).nullish(),
  consent_lgpd: z.literal(true),
  consent_version: z.string().trim().max(20).default("1.0"),
  consent_timestamp: z.string().trim().max(64).optional(),
  email: z.string().trim().email().max(254).optional(),
  // Contexto opcional de página
  page_type: z.string().trim().max(80).optional(),
  page_slug: z.string().trim().max(200).optional(),
  page_color: z.string().trim().max(80).optional(),
  page_city: z.string().trim().max(120).optional(),
  page_intent: z.string().trim().max(80).optional(),
  utm_source: z.string().trim().max(200).nullish(),
  utm_medium: z.string().trim().max(200).nullish(),
  utm_campaign: z.string().trim().max(200).nullish(),
  utm_content: z.string().trim().max(500).nullish(),
  utm_term: z.string().trim().max(500).nullish(),
});

export async function POST(req: NextRequest) {
  let idempotencyStorageKey: string | null = null;
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rate = await rateLimitRequest(req, { scope: "leads", limit: 3, windowMs: 60_000 });
    if (!rate.allowed) return tooManyRequests(rate, "Muitas requisições. Aguarde 1 minuto e tente novamente.");

    const body = await readJsonWithLimit(req, 32 * 1024);
    const validation = leadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validation.error.errors }, { status: 400 });
    }

    const data = validation.data;
    const url = new URL(req.url);

    const idempotency = await beginIdempotentRequest("leads", readIdempotencyKey(req));
    if (idempotency.state === "completed") {
      return NextResponse.json(idempotency.responseBody, {
        status: idempotency.responseStatus,
        headers: { "Idempotency-Replayed": "true" },
      });
    }
    if (idempotency.state === "in_progress") {
      return NextResponse.json(
        { error: "Uma submissão idêntica ainda está sendo processada." },
        { status: 409, headers: { "Retry-After": "2" } },
      );
    }
    idempotencyStorageKey = idempotency.storageKey;

    // UTM params (query tem precedência, fallback no body)
    const utm_source = url.searchParams.get("utm_source") ?? data.utm_source ?? null;
    const utm_medium = url.searchParams.get("utm_medium") ?? data.utm_medium ?? null;
    const utm_campaign = url.searchParams.get("utm_campaign") ?? data.utm_campaign ?? null;
    const utm_content = url.searchParams.get("utm_content") ?? data.utm_content ?? null;
    const utm_term = url.searchParams.get("utm_term") ?? data.utm_term ?? null;

    const { data: inserted, error } = await supabaseAdmin()
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
      console.error("[API /leads] Supabase error:", error);
      await releaseIdempotentRequest(idempotencyStorageKey);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // ── Automação pós-captura (fire-and-forget, nunca bloqueia a resposta) ──
    if (inserted?.id) {
      const leadId = inserted.id;

      // 1. Dispara sequência AutoSales (análise de IA + agendamento de follow-ups)
      const isWaitlist = data.page_type === "notify_me";
      if (!isWaitlist) {
        import("@/lib/ai/autoSalesEngine")
          .then(({ createAutoSalesSequence }) => createAutoSalesSequence(leadId))
          .catch((err) => console.error("[API /leads] autoSales:", err));
      }

      // 2. E-mail automático de confirmação (requer RESEND_API_KEY + email no body)
      const emailAddr = data.email ?? null;
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
    const responseBody = { ok: true, id: inserted?.id ?? null };
    await completeIdempotentRequest(idempotencyStorageKey, 200, responseBody);
    return NextResponse.json(responseBody);
  } catch (e: unknown) {
    await releaseIdempotentRequest(idempotencyStorageKey);
    if (e instanceof RequestBodyError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    const errorMessage = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("[API /leads] Unexpected error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
