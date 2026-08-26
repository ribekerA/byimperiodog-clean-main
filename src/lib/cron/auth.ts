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
 * Sem CRON_SECRET definido a rota RECUSA. A versao anterior deixava passar
 * para nao derrubar o agendamento antes de a chave existir — a chave ja
 * existe: producao responde 401 a um segredo errado, ou seja, a variavel esta
 * configurada no Netlify e o agendador manda o header. A porta aberta agora so
 * serviria para quem descobrisse a URL disparar publicacao e fila de vendas a
 * vontade.
 *
 * Consequencia operacional: se alguem apagar CRON_SECRET do Netlify, o
 * agendamento para de rodar e o log grita cron_sem_segredo. Parar e melhor que
 * ficar aberto.
 *
 * Devolve null quando pode seguir, ou a resposta 401 quando nao pode.
 */
export function autorizarCron(req: Request): NextResponse | null {
  const esperado = process.env.CRON_SECRET?.trim();

  if (!esperado) {
    logger.warn("cron_sem_segredo", {
      aviso: "CRON_SECRET nao definido — endpoint de cron recusando ate a variavel voltar",
    });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
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
