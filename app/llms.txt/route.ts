import { BRAND, FOUNDING_YEAR, PRODUCT_CONFIG } from "@/domain/config";
import { FAIXA_PUBLICA, formatarPreco } from "@/domain/pricing";
import { generatedPosts } from "@/lib/_generated-posts";
import { CORES_EXIBIDAS } from "@/lib/catalog-utils";

/**
 * /llms.txt — indice do site em texto, para quem le com modelo de linguagem.
 *
 * Por que existe
 * -------------
 * O robots.txt ja libera OAI-SearchBot, PerplexityBot, Claude-SearchBot e
 * Google-Extended, e os artigos ja saem com schema Article e citation. Faltava
 * a peca do meio: um arquivo unico que diz, em texto corrido, o que o site e e
 * onde esta cada coisa. Sem ele o modelo monta esse mapa sozinho a partir do
 * HTML de uma pagina qualquer que caiu na busca — e o que ele resume acaba
 * sendo o menu de navegacao.
 *
 * Formato: llms.txt (llmstxt.org) — H1 com o nome, um blockquote de resumo e
 * secoes de links, cada um com uma frase de contexto.
 *
 * Regra de conteudo
 * -----------------
 * Nada aqui e escrito a mao duas vezes. Nome, cidade, ano de fundacao, medidas
 * da raca e faixa de preco saem de src/domain/config.ts; as cores saem de
 * ALL_COLORS; a lista de artigos sai de _generated-posts. Arquivo separado que
 * repete fato de negocio e arquivo que um dia vai contradizer o site — e
 * contradicao entre duas paginas do mesmo dominio e exatamente o que faz um
 * modelo parar de citar a fonte.
 *
 * As rotas fixas abaixo foram conferidas uma a uma contra app/(public)/. Link
 * quebrado aqui custa mais caro que em qualquer outro lugar do site: este
 * arquivo existe para ser lido por maquina, e a maquina nao volta para conferir.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(
  /\/$/,
  ""
);

const NOME_DA_COR: Record<string, string> = {
  branco: "Branco",
  creme: "Creme",
  laranja: "Laranja",
  preto: "Preto",
};

/** Uma linha de link no formato do llms.txt: `- [titulo](url): contexto`. */
function linha(titulo: string, caminho: string, contexto?: string): string {
  return contexto
    ? `- [${titulo}](${SITE_URL}${caminho}): ${contexto}`
    : `- [${titulo}](${SITE_URL}${caminho})`;
}

export async function GET() {
  // Mesmo formatador do site. O `style: "currency"` do Intl separava "R$" do
  // numero com espaco estreito sem quebra, e o llms.txt saia com um caractere
  // invisivel no meio do preco.
  const min = formatarPreco(FAIXA_PUBLICA.minCents);
  const max = formatarPreco(FAIXA_PUBLICA.maxCents);
  const { breed, specs } = PRODUCT_CONFIG;

  // Artigos do mais recente para o mais antigo — a mesma ordem da listagem de
  // /blog, para que as duas nunca se contradigam.
  const artigos = [...generatedPosts]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    // `description` e `excerpt` saem iguais de gen-contentlayer (as duas leem
    // `description` do frontmatter), entao usar so uma delas nao perde nada.
    .map((p) => linha(p.title, p.url, p.description ?? undefined));

  const corpo = [
    `# ${BRAND.name}`,
    "",
    `> Criacao de ${breed.official} (${breed.alternative}) em ${BRAND.headquarters.city}/` +
      `${BRAND.headquarters.state}, Brasil, em atividade desde ${FOUNDING_YEAR}. O site publica o ` +
      `catalogo de filhotes disponiveis, a tabela de precos por cor e sexo (${min} a ${max}) e ` +
      `artigos sobre a raca. Venda direta ao tutor, com entrega em todo o Brasil.`,
    "",
    `O canil divulga ${CORES_EXIBIDAS.length} cores. Femeas custam mais que machos em todas elas.`,
    "Cada filhote sai com laudo de saude veterinario, hemograma, protocolo vacinal conforme a",
    "idade, registro oficial e contrato de responsabilidade compartilhada.",
    "",
    "## Catalogo",
    "",
    linha("Filhotes disponiveis", "/filhotes", "catalogo completo, atualizado conforme as ninhadas"),
    linha("Precos", "/preco-spitz-anao", `tabela por cor e sexo, de ${min} a ${max}`),
    linha("Como comprar", "/comprar-spitz-anao", "passo a passo da reserva ate a entrega"),
    linha("Reservar", "/reserve-seu-filhote", "formulario de reserva"),
    linha("Ninhadas", "/ninhadas", "ninhadas atuais e previstas"),
    linha("Galeria", "/galeria", "fotos dos filhotes e dos adultos do plantel"),
    "",
    "## Filhotes por cor",
    "",
    // CORES_EXIBIDAS, nao ALL_COLORS: o indice lista o que esta sendo
    // divulgado. As URLs de cor fora dessa lista continuam no ar e acessiveis,
    // so nao sao mais anunciadas aqui.
    ...CORES_EXIBIDAS.map((cor) =>
      linha(NOME_DA_COR[cor] ?? cor, `/filhotes/cor/${cor}`, "filhotes desta cor no catalogo")
    ),
    "",
    "## Filhotes por estado",
    "",
    linha("Sao Paulo", "/filhotes/sao-paulo"),
    linha("Rio de Janeiro", "/filhotes/rio-de-janeiro"),
    linha("Minas Gerais", "/filhotes/minas-gerais"),
    "",
    "## Sobre a raca",
    "",
    linha(
      breed.official,
      "/spitz-alemao",
      `adulto de ${specs.adultHeightMin} a ${specs.adultHeightMax} cm e ${specs.adultWeightMin} a ` +
        `${specs.adultWeightMax} kg, expectativa de vida de ${specs.lifeExpectancy}`
    ),
    linha(breed.alternative, "/lulu-da-pomerania", "o mesmo cao, pelo nome mais usado no Brasil"),
    linha("Pomeranian", "/pomeranian", "o mesmo cao, pelo nome usado em ingles"),
    linha("Filhote de Spitz Alemao", "/filhote-de-spitz-alemao"),
    linha("Spitz Alemao branco", "/spitz-alemao-branco"),
    linha("Spitz Alemao preto", "/spitz-alemao-preto"),
    linha("Spitz Alemao baby face", "/spitz-alemao-baby-face", "o que o termo significa na pratica"),
    linha("Temperamento", "/temperamento"),
    linha("Cuidados", "/cuidados"),
    linha("Alimentacao", "/alimentacao"),
    linha("Guias", "/guias", "material de apoio para tutores"),
    linha("FAQ do tutor", "/faq-do-tutor", "duvidas frequentes respondidas"),
    "",
    "## O canil",
    "",
    linha("Sobre a By Imperio Dog", "/sobre", "historia, criterios de criacao e o que acompanha cada filhote"),
    linha("Contato", "/contato", `WhatsApp e ${BRAND.contact.email}`),
    linha("Criador confiavel", "/criador-spitz-confiavel", "como avaliar um canil antes de comprar"),
    linha("Canil no interior de SP", "/canil-spitz-alemao-interior-sp"),
    linha(`Lulu da Pomerania em ${BRAND.headquarters.city}`, "/lulu-da-pomerania-braganca-paulista"),
    linha("Politica editorial", "/politica-editorial", "como o conteudo do blog e produzido e revisado"),
    linha("Politica de privacidade", "/politica-de-privacidade"),
    linha("Termos de uso", "/termos-de-uso"),
    "",
    "## Blog",
    "",
    `${artigos.length} artigos sobre criacao, saude, comportamento, precos e escolha de canil.`,
    "",
    ...artigos,
    "",
    "## Indices",
    "",
    linha("Sitemap", "/sitemap.xml"),
    linha("Sitemap do blog", "/sitemaps/posts.xml"),
    linha("robots.txt", "/robots.txt"),
    "",
  ].join("\n");

  return new Response(corpo, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
