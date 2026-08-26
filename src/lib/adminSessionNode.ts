// Verificacao SINCRONA da cookie assinada admin_session.
//
// Por que existe: `verifyAdminSession` (src/lib/adminSession.ts) usa WebCrypto e
// e async, porque o proxy roda em runtime de borda. Os route handlers, porem,
// chamam `requireAdminApi`, que e sincrono em ~97 call sites. Antes desta
// rodada esse guard aceitava as cookies NAO assinadas `admin_auth=1` e
// `adm=true`, e por isso qualquer pessoa com `curl -H "Cookie: admin_auth=1"`
// passava por ele -- o que so nao virava invasao nas rotas /api/admin/* porque
// o proxy checava a assinatura antes. Nas cinco rotas administrativas que NAO
// vivem sob /api/admin/* o proxy nao chegava a olhar, e o bypass era real (foi
// reproduzido em producao).
//
// Aqui a mesma verificacao HMAC-SHA256 e feita com `node:crypto`, que e
// sincrono. Route handler e Server Component rodam em runtime Node, entao o
// import e seguro; este arquivo nao pode ser importado pelo proxy.ts.
import { createHmac, timingSafeEqual } from "node:crypto";

import type { AdminSessionPayload } from "@/lib/adminSession";

function base64urlParaBuffer(valor: string): Buffer {
  return Buffer.from(valor.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/** Mesmo contrato de `verifyAdminSession`: devolve o payload so quando a
 *  assinatura confere e a sessao nao expirou. Sem ADMIN_SESSION_SECRET
 *  configurado devolve null -- falha fechado, nunca aberto. */
export function verifyAdminSessionSync(token: string | undefined | null): AdminSessionPayload | null {
  if (!token) return null;

  const [corpo, assinatura] = token.split(".");
  if (!corpo || !assinatura) return null;

  const segredo = process.env.ADMIN_SESSION_SECRET;
  if (!segredo) return null;

  try {
    const esperada = createHmac("sha256", segredo).update(corpo).digest();
    const recebida = base64urlParaBuffer(assinatura);
    if (recebida.length !== esperada.length) return null;
    if (!timingSafeEqual(recebida, esperada)) return null;

    const payload = JSON.parse(base64urlParaBuffer(corpo).toString("utf8")) as AdminSessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Le a cookie de sessao de um Request generico ou NextRequest. O guard sincrono
 *  nao pode usar `cookies()` do next/headers (async), entao le do header. */
export function lerCookieDeSessao(req: Request, nome: string): string | undefined {
  const bruto = req.headers.get("cookie");
  if (!bruto) return undefined;
  for (const parte of bruto.split(";")) {
    const igual = parte.indexOf("=");
    if (igual === -1) continue;
    if (parte.slice(0, igual).trim() !== nome) continue;
    return decodeURIComponent(parte.slice(igual + 1).trim());
  }
  return undefined;
}

/** Comparacao de tempo constante para segredos curtos (ADMIN_PASS, tokens de
 *  header). `===` em string vaza o tamanho do prefixo correto pelo tempo. */
export function comparaConstante(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
