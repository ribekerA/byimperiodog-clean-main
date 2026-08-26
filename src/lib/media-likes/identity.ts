import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Identidade anônima de quem curte.
 *
 * Não há login, e não vai haver: pedir cadastro para curtir uma foto de
 * filhote afastaria justamente quem está começando a olhar. Mas sem alguma
 * identidade, "descurtir" não existe e a mesma pessoa curte cem vezes.
 *
 * A solução é a mais fraca que ainda resolve o problema — de propósito:
 *
 *  1. Um token opaco aleatório de 32 bytes, gerado no servidor, entregue em
 *     cookie HttpOnly de primeira parte. O JavaScript da página não lê esse
 *     cookie; nenhum terceiro o recebe.
 *  2. O banco NUNCA vê o token. O que é gravado é
 *     `HMAC-SHA256(token, MEDIA_LIKE_SECRET)`. Sem o segredo — que vive só no
 *     ambiente do servidor — o hash não volta a ser nada.
 *  3. Não há fingerprint de navegador, não há IP guardado, não há nome,
 *     telefone, e-mail ou WhatsApp em lugar nenhum deste caminho.
 *
 * Consentimento: o cookie nasce SOMENTE quando a pessoa curte de verdade — um
 * gesto que ela mesma iniciou e que não funciona sem ele. Ler contagem
 * (GET) não cria cookie nenhum. Ele é estritamente necessário para a função
 * pedida, não serve para publicidade e não é compartilhado, que é o que a
 * política de cookies do site descreve como necessário.
 *
 * Vida útil: 180 dias. É o intervalo em que ainda faz sentido a pessoa voltar,
 * reencontrar a foto e conseguir desfazer a própria curtida. Passado isso o
 * cookie expira sozinho, o token some e a curtida antiga vira contagem órfã —
 * continua contando, mas ninguém consegue mais ligá-la a um visitante.
 */

export const VISITOR_COOKIE = "bid_visitante";
export const VISITOR_COOKIE_MAX_AGE = 180 * 24 * 60 * 60; // segundos

/** Erro previsto: a instalação não tem o segredo configurado. */
export class SegredoAusenteError extends Error {
  constructor() {
    super("MEDIA_LIKE_SECRET não configurado");
    this.name = "SegredoAusenteError";
  }
}

function segredo(): string {
  const valor = process.env.MEDIA_LIKE_SECRET?.trim();
  // Sem fallback embutido. Um segredo padrão no código tornaria o hash
  // reproduzível por qualquer pessoa que leia o repositório, e aí ele deixa de
  // proteger o que existe para proteger.
  if (!valor || valor.length < 16) throw new SegredoAusenteError();
  return valor;
}

export function temSegredoConfigurado(): boolean {
  try {
    segredo();
    return true;
  } catch {
    return false;
  }
}

export function novoToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDoVisitante(token: string): string {
  return createHmac("sha256", segredo()).update(token).digest("hex");
}

/** Comparação de tempo constante — usada só onde dois hashes se comparam. */
export function mesmoHash(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function opcoesDoCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  };
}
