/**
 * Checagens de SEO compartilhadas entre o auditor completo e o monitor de
 * produção.
 *
 * Regra que vale para todo este arquivo: nenhuma checagem pode devolver verde
 * por falta de evidência. Página que não respondeu é `erro`, não é página sem
 * problema; HTML vazio é `erro`; JSON-LD que não parseia é `erro`. O modo de
 * falhar é sempre reprovar, nunca silenciar.
 *
 * Consumidores:
 *  • scripts/seo-audit.ts   — varre o sitemap inteiro e escreve reports/
 *  • scripts/seo-watch.ts   — vigia uma lista curta de URLs críticas em produção
 */

export type Severidade = "erro" | "aviso";

export interface Achado {
  url: string;
  severidade: Severidade;
  regra: string;
  detalhe: string;
}

export interface PaginaBuscada {
  url: string;
  caminho: string;
  status: number;
  contentType: string;
  corpo: string;
  tempoMs: number;
}

export type Busca =
  | { ok: true; caminho: string; pagina: PaginaBuscada }
  | { ok: false; url: string; caminho: string; motivo: string };

/**
 * Lista versionada de URLs críticas (§123).
 *
 * É curta de propósito: monitor que checa 300 páginas por dia vira ruído,
 * ninguém lê, e a primeira regressão de verdade passa despercebida no meio dos
 * avisos. Aqui entram a home, a vitrine, duas fichas de vitrine que representam
 * as pontas da tabela de preços, a página de preço, o blog, um artigo comercial
 * e um editorial, as institucionais e os dois arquivos que o Google lê primeiro.
 */
export const URLS_CRITICAS: readonly string[] = [
  "/",
  "/filhotes",
  "/filhotes/spitz-alemao-anao-branco-femea",
  "/filhotes/spitz-alemao-anao-laranja-femea",
  "/filhotes/spitz-alemao-anao-laranja-femea-laco-rosa",
  "/filhotes/spitz-alemao-anao-preto-femea",
  "/filhotes/spitz-alemao-anao-laranja-macho",
  "/preco-spitz-anao",
  "/blog",
  "/blog/preco-spitz-alemao-anao",
  "/blog/cores-spitz-alemao-anao-qual-mais-cara",
  "/sobre",
  "/contato",
  "/robots.txt",
  "/sitemap-index.xml",
];

/** Prefixos onde o CTA comercial é obrigatório. */
export const PREFIXOS_COMERCIAIS: readonly string[] = [
  "/filhotes",
  "/preco-spitz-anao",
  "/comprar-spitz-anao",
  "/reserve-seu-filhote",
];

/**
 * Vocabulário de estoque público.
 *
 * Os padrões são estreitos de propósito. "disponível" sozinho não entra: a
 * frase permitida "consulte a disponibilidade atual" usa a palavra e não promete
 * nada sobre um animal específico. O que reprova é a palavra usada como ESTADO
 * PÚBLICO daquele filhote — selo, contador, escassez.
 */
export const TERMOS_PROIBIDOS: readonly { regra: string; padrao: RegExp }[] = [
  { regra: "estoque:selo-de-status", padrao: />\s*(Dispon[ií]vel|Reservado|Vendido)\s*</gi },
  { regra: "estoque:status-rotulado", padrao: /status\s*:?\s*(dispon[ií]vel|reservado|vendido)/gi },
  { regra: "estoque:contagem", padrao: /\b\d+\s+(filhotes?\s+)?dispon[ií]ve(l|is)\b/gi },
  { regra: "estoque:contagem", padrao: /\b\d+\s+de\s+\d+\s+filhotes?\b/gi },
  { regra: "estoque:contagem", padrao: /\brestam\s+(apenas\s+)?\d+/gi },
  { regra: "estoque:escassez", padrao: /[úu]ltim[oa]s?\s+dest[ae]\s+cor/gi },
  { regra: "estoque:escassez", padrao: /disponibilidade\s+limitada/gi },
  { regra: "estoque:escassez", padrao: /ninhadas?\s+espor[áa]dicas?/gi },
  { regra: "estoque:escassez", padrao: /estoque\s+baixo|em\s+estoque/gi },
  { regra: "estoque:vitrine-como-estoque", padrao: /filhotes?\s+dispon[ií]ve(l|is)\b/gi },
  { regra: "claim:laudo", padrao: /laudo\s+de\s+sa[úu]de/gi },
  { regra: "claim:vitalicio", padrao: /(mentoria|suporte|acompanhamento)\s+vital[íi]ci[ao]/gi },
];

/** Disponibilidade declarada em dado estruturado — proibida na vitrine (§10/§113). */
const DISPONIBILIDADE_SCHEMA = /InStock|OutOfStock|LimitedAvailability|SoldOut|PreOrder|BackOrder/;

// ─────────────────────────────────────────────────────────────────────────────
// Busca
// ─────────────────────────────────────────────────────────────────────────────

export async function buscarPagina(
  baseUrl: string,
  caminho: string,
  timeoutMs = 20000,
): Promise<Busca> {
  const url = new URL(caminho, baseUrl).toString();
  const inicio = Date.now();
  const controller = new AbortController();
  const relogio = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resposta = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "ByImperioDog-SeoAudit/1.0 (+auditoria interna)" },
    });
    const corpo = await resposta.text();
    return {
      ok: true,
      caminho,
      pagina: {
        url,
        caminho,
        status: resposta.status,
        contentType: resposta.headers.get("content-type") ?? "",
        corpo,
        tempoMs: Date.now() - inicio,
      },
    };
  } catch (erro) {
    // Rede fora, DNS, timeout, porta errada. Devolver `null` aqui — como fazia
    // a versão anterior deste projeto — apagava a diferença entre "não
    // respondeu" e "não perguntei", e era assim que auditor passava com zero
    // página verificada.
    const motivo = erro instanceof Error ? erro.message : String(erro);
    return { ok: false, url, caminho, motivo };
  } finally {
    clearTimeout(relogio);
  }
}

/** Roda buscas em paralelo com limite, preservando a ordem da entrada. */
export async function buscarEmLote(
  baseUrl: string,
  caminhos: readonly string[],
  concorrencia = 6,
  aoTerminar?: (busca: Busca, indice: number, total: number) => void,
): Promise<Busca[]> {
  const resultados: Busca[] = new Array(caminhos.length);
  let proximo = 0;

  async function trabalhador(): Promise<void> {
    for (;;) {
      const indice = proximo++;
      if (indice >= caminhos.length) return;
      const busca = await buscarPagina(baseUrl, caminhos[indice]);
      resultados[indice] = busca;
      aoTerminar?.(busca, indice, caminhos.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concorrencia, caminhos.length) }, () => trabalhador()),
  );
  return resultados;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extração
// ─────────────────────────────────────────────────────────────────────────────

/** Remove script/style/noscript. Sem isso, o payload do React vira "conteúdo". */
export function semScripts(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
}

export function textoVisivel(html: string): string {
  return semScripts(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

export function pegarTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}

/** Lê <meta name="X" content="Y"> nas duas ordens de atributo. */
export function pegarMetaNome(html: string, nome: string): string | null {
  const escapado = nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const direta = new RegExp(
    `<meta[^>]+name=["']${escapado}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const invertida = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*name=["']${escapado}["']`,
    "i",
  );
  const m = html.match(direta) ?? html.match(invertida);
  return m ? m[1].trim() : null;
}

export function pegarMetaPropriedade(html: string, propriedade: string): string | null {
  const escapado = propriedade.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const direta = new RegExp(
    `<meta[^>]+property=["']${escapado}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const invertida = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*property=["']${escapado}["']`,
    "i",
  );
  const m = html.match(direta) ?? html.match(invertida);
  return m ? m[1].trim() : null;
}

export function pegarCanonical(html: string): string | null {
  const direta = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const invertida = html.match(/<link[^>]+href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  const m = direta ?? invertida;
  return m ? m[1].trim() : null;
}

export function contarH1(html: string): number {
  return (semScripts(html).match(/<h1[\s>]/gi) ?? []).length;
}

export function primeiroH1(html: string): string | null {
  const m = semScripts(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  return m[1]
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface BlocoLd {
  bruto: string;
  dados: unknown | null;
  erroDeParse: string | null;
}

export function pegarJsonLd(html: string): BlocoLd[] {
  const blocos: BlocoLd[] = [];
  const padrao = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = padrao.exec(html)) !== null) {
    const bruto = m[1].trim();
    try {
      blocos.push({ bruto, dados: JSON.parse(bruto), erroDeParse: null });
    } catch (erro) {
      blocos.push({
        bruto,
        dados: null,
        erroDeParse: erro instanceof Error ? erro.message : String(erro),
      });
    }
  }
  return blocos;
}

/** Achata @graph e arrays para que a checagem veja todo nó publicado. */
export function achatarLd(dados: unknown): Record<string, unknown>[] {
  const saida: Record<string, unknown>[] = [];
  const visitar = (no: unknown): void => {
    if (Array.isArray(no)) {
      no.forEach(visitar);
      return;
    }
    if (no && typeof no === "object") {
      const obj = no as Record<string, unknown>;
      saida.push(obj);
      if ("@graph" in obj) visitar(obj["@graph"]);
    }
  };
  visitar(dados);
  return saida;
}

export function temImagem(html: string): boolean {
  const limpo = semScripts(html);
  return (
    /<img[\s>]/i.test(limpo) ||
    /<source[^>]+srcset=/i.test(limpo) ||
    /<video[^>]+poster=/i.test(limpo)
  );
}

export function temCtaWhatsapp(html: string): boolean {
  return /wa\.me\/|api\.whatsapp\.com\/send/i.test(html);
}

// ─────────────────────────────────────────────────────────────────────────────
// Auditoria de uma página
// ─────────────────────────────────────────────────────────────────────────────

export interface OpcoesAuditoria {
  /** Host canônico esperado (produção), para comparar com o <link rel=canonical>. */
  hostCanonico?: string;
  /** URL veio do sitemap? Então noindex nela é contradição, não escolha. */
  noSitemap?: boolean;
}

export function auditarPagina(pagina: PaginaBuscada, opcoes: OpcoesAuditoria = {}): Achado[] {
  const achados: Achado[] = [];
  const erro = (regra: string, detalhe: string): void => {
    achados.push({ url: pagina.caminho, severidade: "erro", regra, detalhe });
  };
  const aviso = (regra: string, detalhe: string): void => {
    achados.push({ url: pagina.caminho, severidade: "aviso", regra, detalhe });
  };

  // ── HTTP ──────────────────────────────────────────────────────────────────
  if (pagina.status !== 200) {
    erro("http:status", `respondeu ${pagina.status}`);
    return achados; // sem corpo válido não há o que medir
  }

  const ehXml = /xml/i.test(pagina.contentType) || pagina.caminho.endsWith(".xml");
  const ehTexto = pagina.caminho.endsWith(".txt");

  if (pagina.corpo.trim().length === 0) {
    erro("http:corpo-vazio", "status 200 com corpo vazio");
    return achados;
  }

  // robots.txt e sitemaps: checagem própria, não têm <title>.
  if (ehXml) {
    if (!/<urlset|<sitemapindex/i.test(pagina.corpo)) {
      erro("sitemap:formato", "não contém <urlset> nem <sitemapindex>");
    }
    const locs = (pagina.corpo.match(/<loc>/gi) ?? []).length;
    if (locs === 0) erro("sitemap:vazio", "nenhum <loc> publicado");
    return achados;
  }
  if (ehTexto) {
    if (!/user-agent/i.test(pagina.corpo)) erro("robots:formato", "sem diretiva User-agent");
    if (!/sitemap:/i.test(pagina.corpo)) aviso("robots:sitemap", "não aponta nenhum sitemap");
    return achados;
  }

  // ── Metadados ─────────────────────────────────────────────────────────────
  const title = pegarTitle(pagina.corpo);
  if (!title) erro("meta:title", "página sem <title>");
  else if (title.length < 15) aviso("meta:title", `title curto (${title.length}): "${title}"`);
  else if (title.length > 65) aviso("meta:title", `title longo (${title.length}): "${title}"`);

  const description = pegarMetaNome(pagina.corpo, "description");
  if (!description) erro("meta:description", "página sem meta description");
  else if (description.length < 50)
    aviso("meta:description", `description curta (${description.length})`);
  else if (description.length > 165)
    aviso("meta:description", `description longa (${description.length})`);

  const canonical = pegarCanonical(pagina.corpo);
  if (!canonical) {
    erro("meta:canonical", "página sem <link rel=canonical>");
  } else {
    try {
      const alvo = new URL(canonical);
      const caminhoCanonico = alvo.pathname.replace(/\/$/, "") || "/";
      const caminhoAtual = pagina.caminho.split("?")[0].replace(/\/$/, "") || "/";
      if (caminhoCanonico !== caminhoAtual) {
        aviso("meta:canonical", `canonical aponta para ${caminhoCanonico}, não para ${caminhoAtual}`);
      }
      if (opcoes.hostCanonico && alvo.host !== opcoes.hostCanonico) {
        aviso("meta:canonical", `host canônico ${alvo.host} difere de ${opcoes.hostCanonico}`);
      }
    } catch {
      erro("meta:canonical", `canonical não é URL absoluta: "${canonical}"`);
    }
  }

  const robots = pegarMetaNome(pagina.corpo, "robots") ?? "";
  if (/noindex/i.test(robots)) {
    if (opcoes.noSitemap) {
      erro("indexacao:contradicao", "está no sitemap e se declara noindex");
    } else {
      aviso("indexacao:noindex", `meta robots = "${robots}"`);
    }
  } else {
    // §38 — os limites de preview só valem quando a página é indexável.
    if (!/max-image-preview:\s*large/i.test(robots)) {
      aviso("meta:preview", "sem max-image-preview:large");
    }
    if (!/max-snippet:\s*-1/i.test(robots)) {
      aviso("meta:preview", "sem max-snippet:-1");
    }
  }

  // ── Conteúdo ──────────────────────────────────────────────────────────────
  const h1s = contarH1(pagina.corpo);
  if (h1s === 0) erro("conteudo:h1", "página sem H1");
  else if (h1s > 1) aviso("conteudo:h1", `${h1s} H1 na mesma página`);

  if (!temImagem(pagina.corpo)) aviso("imagem:ausente", "página sem imagem renderizada");
  if (!pegarMetaPropriedade(pagina.corpo, "og:image")) aviso("imagem:og", "sem og:image");

  const texto = textoVisivel(pagina.corpo);
  if (texto.length < 300) {
    aviso("conteudo:magro", `apenas ${texto.length} caracteres de texto visível`);
  }

  // ── Vocabulário proibido (§111/§123) ──────────────────────────────────────
  const alvoBusca = semScripts(pagina.corpo);
  for (const { regra, padrao } of TERMOS_PROIBIDOS) {
    const encontrados = alvoBusca.match(new RegExp(padrao.source, padrao.flags));
    if (encontrados && encontrados.length > 0) {
      const amostra = Array.from(new Set(encontrados.map(t => t.trim()))).slice(0, 3);
      erro(regra, `apareceu no HTML público: ${amostra.map(t => `"${t}"`).join(", ")}`);
    }
  }

  // ── Dado estruturado ──────────────────────────────────────────────────────
  const blocos = pegarJsonLd(pagina.corpo);
  if (blocos.length === 0) {
    aviso("schema:ausente", "página sem JSON-LD");
  }
  for (const bloco of blocos) {
    if (bloco.erroDeParse) {
      erro("schema:parse", `JSON-LD inválido: ${bloco.erroDeParse}`);
      continue;
    }
    for (const no of achatarLd(bloco.dados)) {
      const tipo = String(no["@type"] ?? "");
      if (tipo === "Product") {
        erro("schema:product", "página de vitrine voltou a publicar Product");
      }
      if ("offers" in no) {
        erro("schema:offer", `nó ${tipo || "(sem @type)"} publicou offers`);
      }
      if (tipo === "FAQPage") {
        aviso("schema:faqpage", "FAQPage não gera mais rich result (maio/2026)");
      }
      if ("aggregateRating" in no) {
        erro("schema:rating", `nó ${tipo || "(sem @type)"} publicou aggregateRating`);
      }
    }
    if (DISPONIBILIDADE_SCHEMA.test(bloco.bruto)) {
      erro("schema:disponibilidade", "declarou disponibilidade de estoque em dado estruturado");
    }
  }

  // ── CTA comercial ─────────────────────────────────────────────────────────
  const ehComercial = PREFIXOS_COMERCIAIS.some(
    p => pagina.caminho === p || pagina.caminho.startsWith(`${p}/`),
  );
  if (ehComercial && !temCtaWhatsapp(pagina.corpo)) {
    erro("cta:whatsapp", "página comercial sem CTA de WhatsApp");
  }

  return achados;
}

/** Falha de rede vira achado — nunca ausência de achado. */
export function achadoDeFalha(busca: Extract<Busca, { ok: false }>): Achado {
  return {
    url: busca.caminho,
    severidade: "erro",
    regra: "http:inacessivel",
    detalhe: busca.motivo,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sitemap
// ─────────────────────────────────────────────────────────────────────────────

export function extrairLocs(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)).map(m => m[1]);
}

/**
 * Lê o índice de sitemaps e devolve os caminhos publicados.
 *
 * Devolve `null` quando o índice não pôde ser lido — quem chama decide o que
 * fazer, mas não pode tratar isso como "o site não tem URL".
 */
export async function coletarCaminhosDoSitemap(
  baseUrl: string,
): Promise<{ caminhos: string[]; origem: string } | null> {
  const indice = await buscarPagina(baseUrl, "/sitemap-index.xml");
  if (!indice.ok || indice.pagina.status !== 200) return null;

  const caminhos = new Set<string>();
  const filhos = extrairLocs(indice.pagina.corpo);

  const paraCaminho = (loc: string): string | null => {
    try {
      const u = new URL(loc);
      return `${u.pathname}${u.search}`;
    } catch {
      return loc.startsWith("/") ? loc : null;
    }
  };

  if (/<sitemapindex/i.test(indice.pagina.corpo)) {
    for (const filho of filhos) {
      const caminhoFilho = paraCaminho(filho);
      if (!caminhoFilho) continue;
      const sub = await buscarPagina(baseUrl, caminhoFilho);
      if (!sub.ok || sub.pagina.status !== 200) continue;
      for (const loc of extrairLocs(sub.pagina.corpo)) {
        const c = paraCaminho(loc);
        if (c) caminhos.add(c);
      }
    }
  } else {
    for (const loc of filhos) {
      const c = paraCaminho(loc);
      if (c) caminhos.add(c);
    }
  }

  return { caminhos: Array.from(caminhos), origem: "/sitemap-index.xml" };
}
