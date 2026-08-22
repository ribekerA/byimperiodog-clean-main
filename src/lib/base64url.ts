/**
 * base64url — a codificacao que aparece em token assinado, em desafio PKCE e em
 * qualquer coisa que precise viajar dentro de URL ou de cookie sem escape.
 *
 * Estava escrita dentro de adminSession.ts. Saiu para ca quando o segundo modulo
 * (estado de OAuth) passou a precisar da mesma coisa: duas copias da mesma
 * conversao de bytes e como ter dois relogios em casa — em algum momento um dos
 * dois atrasa.
 *
 * Sem imports: precisa valer no runtime Edge tambem.
 */

export function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// O parametro de tipo e explicito porque as APIs de WebCrypto pedem
// BufferSource, e Uint8Array sem argumento hoje significa ArrayBufferLike —
// que inclui SharedArrayBuffer e nao serve.
export function base64urlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}
