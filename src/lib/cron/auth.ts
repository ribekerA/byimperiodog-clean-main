import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { createLogger } from "@/lib/logger";

const logger = createLogger("cron:auth");

/**
 * Portao unico dos endpoints que o agendador chama.
 *
 * O segredo vive em CRON_SECRET e chega como `Authorization: Bearer <segredo>`
 * — o mesmo formato que /api/cron/publish-scheduled ja usava desde a epoca da
 * Vercel, entao quem ja tinha a variavel configurada nao precisa mexer em nada.
 * `x-cron-secret` tambem serve, porque e mais simples de mandar num curl de
 * teste.
 *
 * Sem CRON_SECRET definido a rota FECHA. Antes ela seguia aberta, com a
 * justificativa de nao derrubar o agendamento no primeiro deploy — na pratica
 * isso deixava publicacao agendada, disparo de venda e revalidacao ao alcance
 * de qualquer um que descobrisse a URL. Falta de chave e falha de
 * configuracao, e falha de configuracao fecha a porta.
 *
 * Tambem exige o metodo esperado: o agendador chama com GET ou POST, e nada
 * mais deve executar o trabalho.
 *
 * Devolve null quando pode seguir, ou a resposta de erro quando nao pode.
 */
const METODOS_ACEITOS = new Set(["GET", "POST"]);

export function autorizarCron(req: Request): NextResponse | null {
  if (!METODOS_ACEITOS.has(req.method.toUpperCase())) {
    return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
  }

  const esperado = process.env.CRON_SECRET?.trim();

  if (!esperado) {
    logger.error("cron_sem_segredo", {
      aviso: "CRON_SECRET nao definido — execucao de cron bloqueada",
    });
    return NextResponse.json(
      { ok: false, error: "cron_nao_configurado" },
      { status: 503 }
    );
  }

  if (esperado.length < 24) {
    logger.error("cron_segredo_curto", { minimo: 24 });
    return NextResponse.json(
      { ok: false, error: "cron_nao_configurado" },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const alternativo = req.headers.get("x-cron-secret")?.trim() ?? "";
  const recebido = bearer || alternativo;

  if (recebido && comparacaoConstante(recebido, esperado)) return null;

  logger.warn("cron_nao_autorizado", { temHeader: Boolean(recebido) });
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

// Comparar com === vazaria o tamanho do prefixo correto pelo tempo de resposta.
// O tamanho total continua observavel — isso e aceito e padrao neste tipo de
// comparacao.
function comparacaoConstante(a: string, b: string) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
