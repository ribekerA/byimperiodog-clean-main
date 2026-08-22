/**
 * Verificacao de assinatura de webhook.
 *
 * A Meta assina cada POST do WhatsApp com HMAC-SHA256 do corpo cru, usando o
 * App Secret, e manda o resultado em `X-Hub-Signature-256: sha256=<hex>`. Sem
 * conferir isso, o endpoint aceita qualquer POST de qualquer pessoa — e no
 * nosso caso aceitar significa rodar o agente de IA e disparar mensagem de
 * WhatsApp pela conta comercial para o numero que o payload mandar.
 *
 * Usa WebCrypto, que existe no Node 20 e no runtime Edge, para o mesmo codigo
 * servir aos dois.
 */

const encoder = new TextEncoder();

/** Comparacao sem vazar o prefixo correto pelo tempo de resposta. */
export function comparacaoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function paraHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** HMAC-SHA256 do corpo cru, em hexadecimal minusculo. */
export async function hmacSha256Hex(segredo: string, corpoCru: string): Promise<string> {
  const chave = await crypto.subtle.importKey(
    "raw",
    encoder.encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return paraHex(await crypto.subtle.sign("HMAC", chave, encoder.encode(corpoCru)));
}

/**
 * Confere o header `X-Hub-Signature-256`.
 *
 * Devolve false quando o header falta, quando vem em outro formato ou quando a
 * assinatura nao bate. Nao lanca: quem chama decide o status da resposta.
 *
 * O corpo precisa ser o texto CRU, byte a byte como chegou. Reserializar o JSON
 * muda espacos e ordem de chaves e faz toda assinatura valida falhar.
 */
export async function assinaturaMetaValida(
  segredo: string,
  corpoCru: string,
  header: string | null
): Promise<boolean> {
  if (!segredo || !header) return false;

  const [algoritmo, recebida] = header.split("=");
  if (algoritmo !== "sha256" || !recebida) return false;

  const esperada = await hmacSha256Hex(segredo, corpoCru);
  return comparacaoConstante(recebida.toLowerCase(), esperada);
}
