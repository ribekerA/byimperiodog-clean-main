import "server-only";

import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Códigos curtos do WhatsApp (tabela whatsapp_refs) no dashboard do admin.
 *
 * Todo código veio de um clique em anúncio do Google com aceite de cookies:
 * quem chega por busca orgânica, Instagram ou direto não ganha código. Por
 * isso "venda marcada" aqui é venda ligada a anúncio, não o total de vendas.
 *
 * A coluna venda_em vem da migração 20261118160000_whatsapp_refs_venda.sql.
 * Enquanto ela não roda, a lista continua aparecendo e só o botão de marcar
 * venda fica de fora (vendaDisponivel: false).
 */

export const LIMITE_DE_CODIGOS = 30;
const DIA_MS = 24 * 3_600_000;

export type CodigoDoWhatsApp = {
  ref: string;
  criadoEm: string;
  pagina: string | null;
  filhote: string | null;
  /** Qual id de clique veio junto: gclid (computador e Android) ou wbraid/gbraid (iPhone). */
  clique: "gclid" | "wbraid" | "gbraid" | null;
  vendaEm: string | null;
  /** Valor da venda em reais; null quando marcada sem valor. */
  vendaValor: number | null;
};

export type ResumoDosCodigos = { codigos7: number; codigos14: number; vendas14: number; vendasTotal: number };

export type CodigosLoad =
  | { status: "ok"; codigos: CodigoDoWhatsApp[]; resumo: ResumoDosCodigos; vendaDisponivel: boolean }
  | { status: "nao_configurado" }
  | { status: "erro"; motivo: string };

type Linha = {
  ref: string;
  created_at: string;
  page: string | null;
  puppy_slug: string | null;
  gclid: string | null;
  wbraid: string | null;
  gbraid: string | null;
  venda_em?: string | null;
  venda_valor?: number | string | null;
};

const COLUNAS = "ref,created_at,page,puppy_slug,gclid,wbraid,gbraid";

function paraCodigo(linha: Linha): CodigoDoWhatsApp {
  return {
    ref: linha.ref,
    criadoEm: linha.created_at,
    pagina: linha.page,
    filhote: linha.puppy_slug,
    clique: linha.gclid ? "gclid" : linha.wbraid ? "wbraid" : linha.gbraid ? "gbraid" : null,
    vendaEm: linha.venda_em ?? null,
    vendaValor: linha.venda_valor == null ? null : Number(linha.venda_valor),
  };
}

/** 42703 = coluna inexistente: a migração da venda ainda não rodou. */
function semColunaDeVenda(error: { code?: string } | null): boolean {
  return error?.code === "42703";
}

function erroDoBanco(contexto: string, error: unknown): string {
  const info = (error ?? {}) as { code?: unknown; message?: unknown };
  console.error(`[admin/whatsapp-refs] ${contexto}`, {
    code: typeof info.code === "string" ? info.code : null,
    message: typeof info.message === "string" ? info.message : String(error),
  });
  return typeof info.code === "string" && info.code === "PGRST205"
    ? "A tabela dos códigos não existe neste banco."
    : "Não foi possível ler os códigos agora.";
}

async function contar(filtro: (q: any) => any): Promise<number> {
  const { count, error } = await filtro(supabaseAdmin().from("whatsapp_refs").select("ref", { count: "exact", head: true }));
  if (error) throw error;
  return count ?? 0;
}

export async function loadCodigos(now: Date = new Date()): Promise<CodigosLoad> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !hasServiceRoleKey()) return { status: "nao_configurado" };
  const desde7 = new Date(now.getTime() - 7 * DIA_MS).toISOString();
  const desde14 = new Date(now.getTime() - 14 * DIA_MS).toISOString();
  try {
    let vendaDisponivel = true;
    let resposta = await supabaseAdmin()
      .from("whatsapp_refs")
      .select(`${COLUNAS},venda_em,venda_valor`)
      .order("created_at", { ascending: false })
      .limit(LIMITE_DE_CODIGOS);
    if (semColunaDeVenda(resposta.error)) {
      vendaDisponivel = false;
      resposta = await supabaseAdmin()
        .from("whatsapp_refs")
        .select(COLUNAS)
        .order("created_at", { ascending: false })
        .limit(LIMITE_DE_CODIGOS);
    }
    if (resposta.error) return { status: "erro", motivo: erroDoBanco("lista", resposta.error) };

    const [codigos7, codigos14, vendas14, vendasTotal] = await Promise.all([
      contar((q) => q.gte("created_at", desde7)),
      contar((q) => q.gte("created_at", desde14)),
      vendaDisponivel ? contar((q) => q.gte("venda_em", desde14)) : Promise.resolve(0),
      vendaDisponivel ? contar((q) => q.not("venda_em", "is", null)) : Promise.resolve(0),
    ]);

    return {
      status: "ok",
      codigos: ((resposta.data ?? []) as Linha[]).map(paraCodigo),
      resumo: { codigos7, codigos14, vendas14, vendasTotal },
      vendaDisponivel,
    };
  } catch (error) {
    return { status: "erro", motivo: erroDoBanco("resumo", error) };
  }
}

/** Um código pelo valor exato (já normalizado por codigoDigitado). */
export async function buscarCodigo(ref: string): Promise<{ codigo: CodigoDoWhatsApp | null; vendaDisponivel: boolean }> {
  let vendaDisponivel = true;
  let resposta = await supabaseAdmin().from("whatsapp_refs").select(`${COLUNAS},venda_em,venda_valor`).eq("ref", ref).maybeSingle();
  if (semColunaDeVenda(resposta.error)) {
    vendaDisponivel = false;
    resposta = await supabaseAdmin().from("whatsapp_refs").select(COLUNAS).eq("ref", ref).maybeSingle();
  }
  if (resposta.error) throw new Error(erroDoBanco("busca", resposta.error));
  return { codigo: resposta.data ? paraCodigo(resposta.data as Linha) : null, vendaDisponivel };
}

/**
 * Marca ou desmarca a venda. Devolve o código atualizado, null se ele não
 * existe, ou "sem_coluna" se a migração da venda ainda não rodou.
 */
export async function marcarVenda(
  ref: string,
  vendido: boolean,
  valor: number | null = null,
  agora: Date = new Date(),
): Promise<CodigoDoWhatsApp | null | "sem_coluna"> {
  const { data, error } = await supabaseAdmin()
    .from("whatsapp_refs")
    .update({
      venda_em: vendido ? agora.toISOString() : null,
      venda_valor: vendido ? valor : null,
    })
    .eq("ref", ref)
    .select(`${COLUNAS},venda_em,venda_valor`)
    .maybeSingle();
  if (semColunaDeVenda(error)) return "sem_coluna";
  if (error) throw new Error(erroDoBanco("marcar venda", error));
  return data ? paraCodigo(data as Linha) : null;
}

/**
 * Vendas marcadas nos últimos `dias` dias, para o export do Google Ads.
 * A separação entre exportáveis e de fora fica em whatsappVendasCsv.ts.
 */
export async function listarVendasMarcadas(dias: number, agora: Date = new Date()) {
  const desde = new Date(agora.getTime() - dias * DIA_MS).toISOString();
  const { data, error } = await supabaseAdmin()
    .from("whatsapp_refs")
    .select("gclid,wbraid,gbraid,venda_em,venda_valor")
    .not("venda_em", "is", null)
    .gte("venda_em", desde)
    .order("venda_em", { ascending: true })
    .limit(10_000);
  if (error) throw new Error(erroDoBanco("export de vendas", error));
  return ((data ?? []) as { gclid: string | null; wbraid: string | null; gbraid: string | null; venda_em: string; venda_valor: number | string | null }[]).map(
    (linha) => ({
      gclid: linha.gclid,
      wbraid: linha.wbraid,
      gbraid: linha.gbraid,
      vendaEm: linha.venda_em,
      valor: linha.venda_valor == null ? null : Number(linha.venda_valor),
    }),
  );
}
