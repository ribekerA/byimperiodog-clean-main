/**
 * Portao das rotas internas (reindex, seed de badges, embeddings pendentes).
 *
 * A versao anterior guardava a frase `byid-internal-v1-2025` e o SHA-256 dela
 * dentro deste arquivo, versionado num repositorio publico. Quem abrisse o
 * codigo tinha a credencial: bastava mandar o header `x-internal-token` com a
 * frase para disparar reindexacao e geracao de embeddings — rotas que gastam
 * chamada de IA e escrevem no banco. Nao havia segredo nenhum, so a aparencia
 * de um.
 *
 * Agora existem dois caminhos, os dois verificados no servidor:
 *   1. sessao de admin assinada (o mesmo cookie do painel);
 *   2. INTERNAL_API_SECRET, segredo de maquina, externo e rotacionavel.
 *
 * Sem INTERNAL_API_SECRET configurado o caminho 2 simplesmente nao existe — a
 * rota nao fica aberta, fica sem essa porta.
 *
 * Implementado com WebCrypto para continuar valendo no runtime Edge.
 */

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/adminSession";

/** Tamanho minimo do segredo. Abaixo disso e senha, nao chave. */
const MIN_SECRET_LENGTH = 24;

function comparacaoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function lerCookie(req: Request, nome: string): string | undefined {
  const bruto = req.headers.get("cookie");
  if (!bruto) return undefined;
  for (const parte of bruto.split(";")) {
    const eq = parte.indexOf("=");
    if (eq < 0) continue;
    if (parte.slice(0, eq).trim() !== nome) continue;
    return decodeURIComponent(parte.slice(eq + 1).trim());
  }
  return undefined;
}

export function verifyInternalToken(headerValue: string | null | undefined): boolean {
  if (!headerValue) return false;
  const esperado = process.env.INTERNAL_API_SECRET?.trim();
  if (!esperado || esperado.length < MIN_SECRET_LENGTH) return false;
  return comparacaoConstante(headerValue, esperado);
}

/** Devolve true quando a chamada pode seguir. */
export async function internalGuard(req: Request): Promise<boolean> {
  const sessao = await verifyAdminSession(lerCookie(req, ADMIN_SESSION_COOKIE));
  if (sessao) return true;
  return verifyInternalToken(req.headers.get("x-internal-token"));
}
