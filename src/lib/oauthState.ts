/**
 * Estado de OAuth: `state` de uso unico + PKCE.
 *
 * Antes, o /login sorteava um `state` com crypto.randomUUID(), mandava para o
 * provedor e esquecia — havia ate um comentario dizendo "opcionalmente guarde o
 * state num cookie". O /callback recebia o `state` de volta e, se viesse vazio,
 * escrevia no log e seguia em frente. Ou seja: o parametro existia, mas nada
 * nunca era conferido.
 *
 * O que isso permitia: eu inicio o fluxo OAuth na MINHA conta de anuncios, pego
 * o `code` que a Meta ou o Google me devolvem, e faco o administrador do site
 * abrir /api/integrations/facebook/callback?code=MEU_CODE. O site troca o meu
 * code por token, salva na tabela `integrations` e passa a mandar os dados de
 * conversao do canil para a minha conta. Isso tem nome: OAuth CSRF, ou ataque
 * de vinculacao de conta.
 *
 * A correcao tem tres partes:
 *
 * 1. O `state` sorteado vai para um cookie httpOnly ASSINADO, junto com o
 *    provedor e o id do administrador que comecou o fluxo. Na volta, o valor da
 *    URL precisa bater com o do cookie — e o cookie e apagado no mesmo pedido,
 *    entao vale uma vez so.
 * 2. PKCE (RFC 7636): o verificador fica no cookie e o desafio (SHA-256) vai
 *    para o provedor. Um `code` interceptado nao vira token sem o verificador.
 * 3. Validade curta. Dez minutos e mais que o suficiente para uma pessoa clicar
 *    em "permitir", e curto o bastante para um cookie esquecido nao servir de
 *    nada amanha.
 *
 * A assinatura usa ADMIN_SESSION_SECRET, o mesmo segredo da sessao: girar essa
 * variavel invalida tambem os fluxos de OAuth em andamento, o que e o
 * comportamento desejado.
 */

import { base64url, base64urlToBytes } from "@/lib/base64url";

export const OAUTH_STATE_COOKIE = "admin_oauth_state";

/** Dez minutos: tempo de clicar em "permitir", nao de deixar aberto. */
export const OAUTH_STATE_MAX_AGE = 10 * 60;

export type OAuthStatePayload = {
  provider: string;
  /** O valor que viaja na URL como `state`. */
  nonce: string;
  /** Verificador PKCE. Nunca sai do cookie. */
  verifier: string;
  /** Quem comecou o fluxo — o token e gravado para esta pessoa, nao para outra. */
  userId: string;
  exp: number;
};

function encoder(): TextEncoder {
  return new TextEncoder();
}

async function chaveDeAssinatura(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET nao configurado - estado de OAuth nao pode ser assinado.");
  }
  return crypto.subtle.importKey("raw", encoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

/** Comparacao sem vazar o prefixo correto pelo tempo de resposta. */
function comparacaoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function aleatorio(bytes: number): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** Desafio PKCE S256: base64url(SHA-256(verificador)). */
export async function desafioPkce(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder().encode(verifier));
  return base64url(hash);
}

export type EstadoCriado = {
  /** Vai na URL de autorizacao. */
  state: string;
  /** Vai na URL de autorizacao, no lugar do verificador. */
  codeChallenge: string;
  /** Vai no cookie httpOnly. */
  cookie: string;
};

export async function criarEstadoOAuth(opts: {
  provider: string;
  userId: string;
}): Promise<EstadoCriado> {
  const nonce = aleatorio(24);
  // 32 bytes em base64url dao 43 caracteres, dentro da faixa de 43 a 128 que a
  // RFC 7636 exige para o verificador.
  const verifier = aleatorio(32);
  const payload: OAuthStatePayload = {
    provider: opts.provider,
    nonce,
    verifier,
    userId: opts.userId,
    exp: Math.floor(Date.now() / 1000) + OAUTH_STATE_MAX_AGE,
  };

  const corpo = base64url(encoder().encode(JSON.stringify(payload)));
  const assinatura = await crypto.subtle.sign("HMAC", await chaveDeAssinatura(), encoder().encode(corpo));

  return {
    state: nonce,
    codeChallenge: await desafioPkce(verifier),
    cookie: `${corpo}.${base64url(assinatura)}`,
  };
}

/**
 * Confere o retorno do provedor.
 *
 * Devolve o conteudo do estado quando tudo bate, e null em qualquer outra
 * situacao — assinatura invalida, prazo vencido, provedor trocado no meio do
 * caminho ou `state` diferente do que foi emitido. Quem chama responde 400 e
 * apaga o cookie; nao ha caso em que valha a pena seguir adiante.
 */
export async function conferirEstadoOAuth(opts: {
  cookie: string | undefined | null;
  stateRecebido: string;
  provider: string;
}): Promise<OAuthStatePayload | null> {
  if (!opts.cookie || !opts.stateRecebido) return null;

  const [corpo, assinatura] = opts.cookie.split(".");
  if (!corpo || !assinatura) return null;

  try {
    const valida = await crypto.subtle.verify(
      "HMAC",
      await chaveDeAssinatura(),
      base64urlToBytes(assinatura),
      encoder().encode(corpo)
    );
    if (!valida) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(corpo))) as OAuthStatePayload;

    if (!payload?.nonce || !payload?.verifier || !payload?.provider) return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.provider !== opts.provider) return null;
    if (!comparacaoConstante(payload.nonce, opts.stateRecebido)) return null;

    return payload;
  } catch {
    return null;
  }
}
