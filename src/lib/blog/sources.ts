/**
 * Fontes citadas por um artigo.
 *
 * O frontmatter guarda cada fonte como UMA linha de texto:
 *
 *   sources:
 *     - FCI | Padrão FCI nº 97 — German Spitz | https://www.fci.be/en/nomenclature/GERMAN-SPITZ-97.html
 *
 * Uma linha, e não um objeto aninhado, porque o parser de frontmatter em
 * scripts/gen-contentlayer.mjs é escrito à mão e só entende escalares e listas
 * simples de `- item`. Um `- title:` com `publisher:` embaixo seria lido pela
 * metade, em silêncio. O pipe resolve: nunca aparece no nome de uma instituição
 * nem no título de um padrão de raça.
 *
 * Sem aspas em volta: o mesmo parser tira aspas de escalares, mas NÃO de itens
 * de lista — com aspas, a primeira sobra colada no publicador e a última na URL.
 *
 * Editando um artigo à mão, o formato é: PUBLICADOR | TÍTULO | URL
 */

export type ArticleSource = {
  publisher: string;
  title: string;
  url: string;
};

/**
 * Aceita também as duas formas incompletas, porque quem escreve o artigo não
 * deve perder a fonte por causa de um pipe a menos:
 *   'Título | https://...'     -> sem publicador
 *   'https://...'              -> só a URL
 * Devolve só o que tem URL http(s) — sem URL não é fonte, é opinião.
 */
export function parseSources(raw: string[] | null | undefined): ArticleSource[] {
  if (!Array.isArray(raw)) return [];

  const out: ArticleSource[] = [];
  for (const linha of raw) {
    if (typeof linha !== "string") continue;

    const partes = linha.split("|").map((p) => p.trim()).filter(Boolean);
    const url = partes.find((p) => /^https?:\/\//i.test(p));
    if (!url) continue;

    const resto = partes.filter((p) => p !== url);
    const [publisher = "", title = ""] = resto.length >= 2 ? resto : ["", resto[0] ?? ""];

    out.push({
      publisher,
      // Sem título, o link precisa de algum rótulo legível: o domínio serve.
      title: title || hostname(url),
      url,
    });
  }
  return out;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Formato `citation` do schema.org. É o campo que declara, de forma legível por
 * máquina, em que o artigo se apoia — o que sistemas generativos usam para
 * decidir se a página é apoiada em fonte primária ou é só mais um texto.
 */
export function sourcesToCitation(sources: ArticleSource[]) {
  if (!sources.length) return undefined;
  return sources.map((s) => ({
    "@type": "CreativeWork",
    name: s.title,
    url: s.url,
    ...(s.publisher ? { publisher: { "@type": "Organization", name: s.publisher } } : {}),
  }));
}
