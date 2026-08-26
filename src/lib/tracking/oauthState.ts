// Estado (nonce) do fluxo OAuth das integrações de tracking.
//
// O callback aceitava qualquer `code` que chegasse, com um TODO no lugar da
// verificação. Sem o nonce, bastava induzir o admin logado a abrir uma URL de
// callback preparada para gravar a conta de anúncio de outra pessoa como
// integração do canil -- CSRF de OAuth, o caso clássico.
//
// O valor é sorteado no /login, guardado em cookie HttpOnly de vida curta e
// conferido no /callback. Cookie e não banco porque o fluxo é de uma aba só e
// dura menos de dez minutos.
import { timingSafeEqual } from "node:crypto";

export const PREFIXO_COOKIE_STATE = "oauth_state_";
export const VALIDADE_STATE_S = 600;

export function nomeDoCookieDeState(provider: string): string {
  return PREFIXO_COOKIE_STATE + provider.replace(/[^a-z0-9_]/gi, "");
}

/** Atributos do cookie de state. Secure só em produção para não quebrar o
 *  fluxo em http://localhost durante o desenvolvimento. */
export function cookieDeState(provider: string, valor: string, maxAge = VALIDADE_STATE_S): string {
  const partes = [
    `${nomeDoCookieDeState(provider)}=${valor}`,
    "Path=/api/integrations",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (process.env.NODE_ENV === "production") partes.push("Secure");
  return partes.join("; ");
}

export function lerCookie(req: Request, nome: string): string | undefined {
  const cru = req.headers.get("cookie");
  if (!cru) return undefined;
  for (const parte of cru.split(";")) {
    const idx = parte.indexOf("=");
    if (idx === -1) continue;
    if (parte.slice(0, idx).trim() === nome) return parte.slice(idx + 1).trim();
  }
  return undefined;
}

export function stateConfere(recebido: string, esperado: string | undefined): boolean {
  if (!recebido || !esperado) return false;
  const a = Buffer.from(recebido, "utf8");
  const b = Buffer.from(esperado, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
