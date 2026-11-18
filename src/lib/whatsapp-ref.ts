import { getClickAttribution } from "@/lib/gclid";

/**
 * Código curto na mensagem do WhatsApp (aprovado pelo usuário em 18/11/2026).
 *
 * Só para quem chegou por anúncio do Google e aceitou cookies de marketing:
 * sem gclid/wbraid/gbraid guardado, nada muda na mensagem. O código vai no
 * fim do texto, "(cód. K7M2Q)", e o clique do anúncio fica guardado no banco
 * com esse código (tabela whatsapp_refs). O gclid nunca entra na mensagem.
 *
 * Um código por sessão: tocar em dois botões não gera dois códigos.
 */

// Sem 0/O, 1/I/L e U/V: lido em voz alta ou digitado, não se confunde.
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTWXYZ";
export const TAMANHO_DO_REF = 5;
export const FORMATO_DO_REF = new RegExp(`^[${ALFABETO}]{${TAMANHO_DO_REF}}$`);
const CHAVE_SESSAO = "bid_wa_ref_v1";

export function gerarRef(aleatorio: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = aleatorio(TAMANHO_DO_REF);
  let ref = "";
  for (let i = 0; i < TAMANHO_DO_REF; i++) ref += ALFABETO[bytes[i]! % ALFABETO.length];
  return ref;
}

/**
 * Acha o código no que foi colado no painel: "K7M2Q", "k7m2q" ou o trecho
 * inteiro da conversa, "(cód. K7M2Q)". Devolve null quando não há código.
 */
export function codigoDigitado(texto: string): string | null {
  const maiusculo = (texto ?? "").toUpperCase();
  // Com "cód." na frente vale em qualquer ponto do texto; sem ele, só o código
  // sozinho. Procurar qualquer palavra de 5 letras pegaria "GENTE" da conversa.
  const marcado = maiusculo.match(/C[OÓ]D\.?\s*([A-Z0-9]+)/);
  const candidato = marcado ? marcado[1] : maiusculo.trim();
  return FORMATO_DO_REF.test(candidato) ? candidato : null;
}

/** Acrescenta o código ao texto do link wa.me / api.whatsapp.com. Devolve null se não der. */
export function hrefComRef(href: string, ref: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const texto = url.searchParams.get("text") ?? "";
  if (texto.includes(`(cód. ${ref})`)) return href;
  const novoTexto = texto ? `${texto} (cód. ${ref})` : `(cód. ${ref})`;
  // Montado à mão: URLSearchParams troca espaço por "+", e o WhatsApp às vezes
  // mostra o "+" literal na mensagem.
  const outros = [...url.searchParams]
    .filter(([chave]) => chave !== "text")
    .map(([chave, valor]) => `${encodeURIComponent(chave)}=${encodeURIComponent(valor)}`);
  url.search = [...outros, `text=${encodeURIComponent(novoTexto)}`].join("&");
  return url.toString();
}

type Sessao = { ref: string; enviados: string[] };

function lerSessao(): Sessao | null {
  try {
    const cru = window.sessionStorage.getItem(CHAVE_SESSAO);
    if (!cru) return null;
    const s = JSON.parse(cru) as Sessao;
    return FORMATO_DO_REF.test(s.ref) && Array.isArray(s.enviados) ? s : null;
  } catch {
    return null;
  }
}

function gravarSessao(s: Sessao) {
  try {
    window.sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(s));
  } catch {
    // Sem sessionStorage o código só não se repete entre botões.
  }
}

/**
 * Chamado no clique em um link de contato do WhatsApp. Reescreve o href do
 * próprio <a> antes do navegador seguir o link e avisa o servidor. Nunca
 * segura nem cancela o clique.
 */
export function anexarRefAoLink(link: HTMLAnchorElement, puppySlug: string | null): string | null {
  const clique = getClickAttribution();
  if (!clique.gclid && !clique.wbraid && !clique.gbraid) return null;

  const sessao = lerSessao() ?? { ref: gerarRef(), enviados: [] };
  const novo = hrefComRef(link.href, sessao.ref);
  if (!novo) return null;
  link.setAttribute("href", novo);

  const chave = puppySlug ?? "";
  if (!sessao.enviados.includes(chave)) {
    sessao.enviados.push(chave);
    enviarRef({
      ref: sessao.ref,
      gclid: clique.gclid ?? null,
      wbraid: clique.wbraid ?? null,
      gbraid: clique.gbraid ?? null,
      page: window.location.pathname,
      puppySlug,
    });
  }
  gravarSessao(sessao);
  return sessao.ref;
}

function enviarRef(dados: Record<string, string | null>) {
  try {
    const corpo = JSON.stringify(dados);
    const nav = navigator as Navigator & { sendBeacon?: (url: string, data: Blob) => boolean };
    const ok = nav.sendBeacon?.("/api/whatsapp/ref", new Blob([corpo], { type: "application/json" }));
    if (!ok) {
      void fetch("/api/whatsapp/ref", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: corpo,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Perder o registro não pode atrapalhar o WhatsApp.
  }
}
