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
 * Sem CRON_SECRET definido a rota continua aberta, do jeito que estava. E
 * proposital: trancar a porta antes de entregar a chave derrubaria o
 * agendamento no primeiro deploy. O aviso no log existe para essa configuracao
 * nao passar despercebida.
 *
 * Devolve null quando pode seguir, ou a resposta 401 quando nao pode.
 */
export function autorizarCron(req: Request): NextResponse | null {
  const esperado = process.env.CRON_SECRET?.trim();

  if (!esperado) {
    logger.warn("cron_sem_segredo", {
      aviso: "CRON_SECRET nao definido — endpoint de cron respondendo sem autenticacao",
    });
    return null;
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
