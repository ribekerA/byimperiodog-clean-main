import { getCurrentConsent } from "@/lib/consent";

/**
 * Conversões otimizadas do Google Ads (aprovado pelo usuário em 18/11/2026).
 *
 * O telefone do formulário vira um hash SHA-256 aqui no navegador, e só esse
 * código sai para o Google. O número em si nunca entra no dataLayer. Só roda
 * com aceite de marketing, como diz a política de privacidade.
 *
 * O formulário aceita DDD + número (10 ou 11 dígitos), sempre do Brasil, então
 * o formato E.164 é "+55" seguido desses dígitos.
 *
 * Para o Ads usar o código, a tag de conversão do formulário no GTM precisa ter
 * "dados fornecidos pelo usuário" ligados, lendo a variável de camada de dados
 * user_data.sha256_phone_number. Essa parte é configuração do GTM, não daqui.
 */

export function telefoneE164(digitos: string): string | null {
  const limpo = digitos.replace(/\D/g, "");
  if (!/^\d{10,11}$/.test(limpo)) return null;
  return `+55${limpo}`;
}

export async function sha256Hex(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Publica o telefone em hash para a próxima conversão. Devolve true quando
 * publicou. Chame antes de disparar o evento do formulário.
 */
export async function publicarTelefoneParaConversao(digitos: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (!getCurrentConsent().marketing) return false;
    const e164 = telefoneE164(digitos);
    if (!e164 || !crypto?.subtle) return false;

    const userData = { sha256_phone_number: await sha256Hex(e164) };
    const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ user_data: userData });
    if (typeof w.gtag === "function") w.gtag("set", "user_data", userData);
    return true;
  } catch {
    // Sem o hash a conversão ainda dispara, só sem o reforço.
    return false;
  }
}
