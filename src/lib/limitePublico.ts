// Guardas para rotas públicas de escrita.
//
// Antes desta rodada, quase toda rota pública de POST fazia `await req.json()`
// direto: sem teto de tamanho, sem limite de taxa. Quem soubesse a URL podia
// empurrar megabytes por requisição e repetir à vontade. Em rota que grava no
// banco isso enche tabela; em rota que chama IA, isso vira fatura.
//
// Os limites aqui são deliberadamente frouxos. O objetivo é tirar o abuso
// barato do caminho, não brigar com visitante legítimo — perder um comentário
// ou uma avaliação real custa mais que aguentar alguns POSTs a mais.
//
// A memória de processo corta rajadas baratas imediatamente. A segunda camada
// usa um contador atômico no banco para que o limite continue valendo entre
// instâncias serverless e cold starts. O IP nunca sai daqui em texto puro: a
// chave persistida é um HMAC com segredo exclusivo do servidor.
import { createHmac } from "node:crypto";

import { NextResponse } from "next/server";

import { createLogger } from "@/lib/logger";
import { rateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("public-rate-limit");
let avisoSegredoAusenteEmitido = false;
let avisoDistribuidoIndisponivelEmitido = false;

/** Corpo máximo padrão. Nenhum formulário do site chega perto de 16 KB. */
export const LIMITE_CORPO_PADRAO = 16 * 1024;

export function ipDoCliente(req: Request): string {
  const encaminhado = req.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "anon";
}

/**
 * IP sem o ultimo octeto (IPv4) ou sem os ultimos blocos (IPv6).
 *
 * `analytics_events` guardava o IP inteiro de quem visitava. Ninguem lia
 * esse campo: o agregador da propria rota seleciona `name,value,ts`, e a
 * replicacao para `analytics_events_outbox` ja removia o IP de proposito.
 * Guardado sem finalidade, ele faz de cada linha um dado pessoal sob a LGPD.
 * Truncar preserva o que a metrica usa -- regiao aproximada e deduplicacao
 * grosseira -- e tira a capacidade de singularizar uma pessoa.
 */
export function ipAnonimo(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const limpo = ip.trim();
  if (!limpo) return null;
  if (limpo.includes(":")) {
    const blocos = limpo.split(":").filter(Boolean);
    return blocos.slice(0, 3).join(":") + "::";
  }
  const octetos = limpo.split(".");
  if (octetos.length !== 4) return null;
  octetos[3] = "0";
  return octetos.join(".");
}

/**
 * Limite de taxa por IP em janela fixa. Devolve a resposta 429 pronta quando
 * estourou, ou `null` quando pode seguir.
 */
export async function limiteDeTaxa(
  req: Request,
  escopo: string,
  capacidade: number,
  janelaMs = 60_000,
): Promise<NextResponse | null> {
  const ip = ipDoCliente(req);
  const local = rateLimit(`${escopo}:${ip}`, capacidade, janelaMs);
  if (!local.allowed) {
    const retryAfter = Math.max(1, Math.ceil((new Date(local.reset).getTime() - Date.now()) / 1000));
    return respostaDeLimite(retryAfter);
  }

  const segredo = process.env.PUBLIC_RATE_LIMIT_SECRET || process.env.ADMIN_SESSION_SECRET || "";
  if (segredo.length < 32) {
    if (!avisoSegredoAusenteEmitido) {
      avisoSegredoAusenteEmitido = true;
      logger.warn("Segredo do limitador distribuido ausente; usando apenas a camada local");
    }
    return null;
  }

  try {
    const chave = createHmac("sha256", segredo).update(`${escopo}:${ip}`).digest("hex");
    const cliente = supabaseAdmin() as unknown as {
      rpc: (nome: string, argumentos: Record<string, unknown>) => Promise<{
        data: Array<{ allowed: boolean; retry_after_seconds: number }> | null;
        error: { message?: string } | null;
      }>;
    };
    const { data, error } = await cliente.rpc("consume_public_rate_limit", {
      p_key_hash: chave,
      p_limit: capacidade,
      p_window_seconds: Math.max(1, Math.ceil(janelaMs / 1000)),
    });
    if (error) throw new Error(error.message || "public rate limit RPC failed");

    const decisao = data?.[0];
    if (decisao && !decisao.allowed) {
      return respostaDeLimite(Math.max(1, decisao.retry_after_seconds));
    }
  } catch (error) {
    // Disponibilidade do formulário prevalece se a migração ainda não foi
    // aplicada ou o banco estiver momentaneamente indisponível. A barreira
    // local acima continua ativa.
    if (!avisoDistribuidoIndisponivelEmitido) {
      avisoDistribuidoIndisponivelEmitido = true;
      logger.warn("Limitador distribuido indisponivel; usando limite local", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return null;
}

function respostaDeLimite(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Muitas requisições. Aguarde um instante e tente novamente." },
    { status: 429, headers: { "retry-after": String(retryAfter) } },
  );
}

/** Recusa cedo pelo Content-Length declarado. Útil para multipart/form-data,
 *  onde ler o corpo inteiro só para medir já seria o custo que se quer evitar. */
export function excedeTamanhoDeclarado(req: Request, limiteBytes: number): NextResponse | null {
  const declarado = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declarado) && declarado > limiteBytes) {
    return NextResponse.json({ error: "Envio grande demais." }, { status: 413 });
  }
  return null;
}

type CorpoLido<T> = { dados: T; resposta?: undefined } | { dados?: undefined; resposta: NextResponse };

/**
 * Lê o corpo como texto (para poder medir antes de desserializar) e devolve o
 * JSON. Em corpo grande demais responde 413; em JSON inválido, 400.
 */
export async function corpoJson<T>(req: Request, limiteBytes = LIMITE_CORPO_PADRAO): Promise<CorpoLido<T>> {
  const declarado = excedeTamanhoDeclarado(req, limiteBytes);
  if (declarado) return { resposta: declarado };

  let cru: string;
  try {
    cru = await req.text();
  } catch {
    return { resposta: NextResponse.json({ error: "Corpo inválido" }, { status: 400 }) };
  }

  if (cru.length > limiteBytes) {
    return { resposta: NextResponse.json({ error: "Envio grande demais." }, { status: 413 }) };
  }

  try {
    return { dados: JSON.parse(cru) as T };
  } catch {
    return { resposta: NextResponse.json({ error: "JSON inválido" }, { status: 400 }) };
  }
}
