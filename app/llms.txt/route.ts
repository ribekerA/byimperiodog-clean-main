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
    `> Criação de ${breed.official} (${breed.alternative}) em ${BRAND.headquarters.city}/` +
      `${BRAND.headquarters.state}, Brasil, em atividade desde ${FOUNDING_YEAR}. O site publica o ` +
      `catálogo de filhotes disponíveis, a tabela de preços por cor e sexo (${min} a ${max}) e ` +
      `artigos sobre a raça. Venda direta ao tutor, com entrega em todo o Brasil.`,
    "",
    `O canil divulga ${CORES_EXIBIDAS.length} cores. Fêmeas custam mais que machos em todas elas.`,
    "Cada filhote sai vacinado e vermifugado, com consulta veterinária, hemograma completo,",
    "pedigree e contrato de responsabilidade compartilhada.",
    "",
    "## Catálogo",
    "",
    linha("Filhotes disponíveis", "/filhotes", "catálogo completo, atualizado conforme as ninhadas"),
    linha("Preços", "/preco-spitz-anao", `tabela por cor e sexo, de ${min} a ${max}`),
    linha("Como comprar", "/comprar-spitz-anao", "passo a passo da reserva até a entrega"),
    linha("Reservar", "/reserve-seu-filhote", "formulário de reserva"),
    linha("Ninhadas", "/ninhadas", "ninhadas atuais e previstas"),
    // A galeria é de vídeo, não de foto: arquivos MP4 dos filhotes e das
    // ninhadas. Descrever como "fotos" mandava o leitor automático procurar o
    // que não está lá.
    linha("Galeria", "/galeria", "vídeos dos filhotes e das ninhadas"),
    "",
    "## Filhotes por cor",
    "",
    // CORES_EXIBIDAS, nao ALL_COLORS: o indice lista o que esta sendo
    // divulgado. As URLs de cor fora dessa lista continuam no ar e acessiveis,
    // so nao sao mais anunciadas aqui.
    ...CORES_EXIBIDAS.map((cor) =>
      linha(NOME_DA_COR[cor] ?? cor, `/filhotes/cor/${cor}`, "filhotes desta cor no catálogo")
    ),
    "",
    "## Filhotes por estado",
    "",
    linha("São Paulo", "/filhotes/sao-paulo"),
    linha("Rio de Janeiro", "/filhotes/rio-de-janeiro"),
    linha("Minas Gerais", "/filhotes/minas-gerais"),
    "",
    "## Sobre a raça",
    "",
    linha(
      breed.official,
      "/spitz-alemao",
      `altura oficial de ${specs.officialAdultHeight}, peso ${specs.officialAdultWeight}, ` +
        `expectativa de vida de ${specs.lifeExpectancy}`
    ),
    linha(breed.alternative, "/lulu-da-pomerania", "o mesmo cão, pelo nome mais usado no Brasil"),
    linha("Pomeranian", "/pomeranian", "o mesmo cão, pelo nome usado em inglês"),
    linha("Filhote de Spitz Alemão", "/filhote-de-spitz-alemao"),
    linha("Spitz Alemão branco", "/spitz-alemao-branco"),
    linha("Spitz Alemão preto", "/spitz-alemao-preto"),
    linha("Spitz Alemão baby face", "/spitz-alemao-baby-face", "o que o termo significa na prática"),
    linha("Temperamento", "/temperamento"),
    linha("Cuidados", "/cuidados"),
    linha("Alimentação", "/alimentacao"),
    linha("Guias", "/guias", "material de apoio para tutores"),
    linha("FAQ do tutor", "/faq-do-tutor", "dúvidas frequentes respondidas"),
    "",
    "## O canil",
    "",
    linha("Sobre a By Império Dog", "/sobre", "história, critérios de criação e o que acompanha cada filhote"),
    linha("Contato", "/contato", `WhatsApp e ${BRAND.contact.email}`),
    linha("Criador confiável", "/criador-spitz-confiavel", "como avaliar um canil antes de comprar"),
    linha("Canil no interior de SP", "/canil-spitz-alemao-interior-sp"),
    linha(`Lulu da Pomerânia em ${BRAND.headquarters.city}`, "/lulu-da-pomerania-braganca-paulista"),
    linha("Política editorial", "/politica-editorial", "como o conteúdo do blog é produzido e revisado"),
    linha("Política de privacidade", "/politica-de-privacidade"),
    linha("Termos de uso", "/termos-de-uso"),
    "",
    "## Blog",
    "",
    `${artigos.length} artigos sobre criação, saúde, comportamento, preços e escolha de canil.`,
    "",
    ...artigos,
    "",
    "## Índices",
    "",
    linha("Sitemap", "/sitemap.xml"),
    linha("Sitemap do blog", "/sitemaps/posts.xml"),
    linha("Sitemap de imagens", "/sitemaps/images.xml"),
    linha("Sitemap de vídeos", "/sitemaps/videos.xml"),
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
