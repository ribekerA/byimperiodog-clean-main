/**
 * Portao editorial em tempo de execucao — o par de scripts/quality-gate.mjs.
 *
 * Por que existe
 * -------------
 * O blog tem duas fontes. Artigo em content/posts/*.mdx passa por
 * scripts/quality-gate.mjs no prebuild: artigo fino, sem data, sem link
 * interno ou com titulo duplicado quebra o build antes de virar pagina.
 * Linha na tabela `blog_posts` nao passava por nada disso — a unica barreira
 * era contar 800 caracteres de corpo.
 *
 * Ou seja: as regras que protegem os 30 artigos publicados nao valiam para o
 * que a IA escrevesse. Um rascunho gerado sem chave da OpenAI (ver o fallback
 * que existia em app/api/admin/blog/ai/*) passa dos 800 caracteres com folga e
 * viraria pagina publica, entrada no sitemap e texto que o Google le como
 * conteudo raso do dominio inteiro.
 *
 * Este modulo aplica as MESMAS regras de ERRO do quality-gate a uma linha do
 * banco. O script continua sendo a autoridade no caminho do git — ele roda com
 * o corpus inteiro em maos e pode comparar artigos entre si. Aqui a decisao e
 * sobre um post por vez, entao valem as regras que nao dependem do corpus.
 *
 * Onde e aplicado: isPublishableSupabasePost (src/lib/blog/publishable.ts),
 * que e o unico ponto por onde uma linha do banco vira rota, item de listagem
 * ou URL no sitemap.
 *
 * Regras de negocio (06/11/2026)
 * ------------------------------
 * Alem da forma do artigo, o portao passou a conferir o que a responsavel
 * decidiu sobre o texto: Lulu da Pomerania em toda frase, preco na forma oficial,
 * sem parcelamento, sem termos proibidos. Regex nao reconhece toda afirmacao
 * inventada; por isso a IA so grava rascunho e alguem revisa antes de publicar.
 * Isto e a ultima barreira, nao a revisao.
 */

import { FOUNDING_YEAR } from "../../domain/config";
import {
  PISO_FEMEA,
  PISO_MACHO,
  PRECO_POR_SLUG,
  TABELA_DE_PRECOS,
  textoAPartirDeNoPix,
} from "../../domain/pricing";

/**
 * O mesmo conjunto de regras, escrito para o modelo. Fica ao lado da conferencia
 * para que o pedido e a cobranca nao se separem quando uma regra mudar.
 */
export const REGRAS_DE_NEGOCIO_PARA_IA = [
  "Regras obrigatórias da By Império Dog (texto fora delas não é publicado):",
  '- Toda frase que citar "Spitz Alemão" precisa citar também "Lulu da Pomerânia" na mesma frase, inclusive título, resumo e subtítulos.',
  `- Preço de filhote só nestas formas: "${textoAPartirDeNoPix(PISO_MACHO)}" para machos e "${textoAPartirDeNoPix(PISO_FEMEA)}" para fêmeas. Nenhum outro valor de filhote e nada de parcelamento.`,
  `- A empresa atua desde ${FOUNDING_YEAR}. Nem todo filhote nasceu na empresa: escreva "filhotes apresentados pela By Império Dog" e nunca que todos nasceram ou foram criados nela.`,
  "- Não invente pedigree, microchip, exames, ascendência, certificações, garantias ou informações veterinárias. Em assunto de saúde, oriente procurar o médico-veterinário.",
  "- Nunca use as palavras adoção, doação ou boutique, e não cite a cor Cinza-Lobo (Wolf Sable).",
].join("\n");

/** Espelha PALAVRAS_MIN do quality-gate: piso abaixo do menor artigo de hoje. */
export const PALAVRAS_MIN = 600;

/**
 * Marcas de rascunho automatico.
 *
 * Sao as frases que as rotas de IA cuspiam quando OPENAI_API_KEY estava
 * ausente. Os fallbacks foram removidos, entao nada novo nasce assim — mas
 * linha gravada antes disso continua no banco, e basta alguem marcar como
 * `published` para ir ao ar. A checagem custa um indexOf e fecha essa porta.
 *
 * Todas em minusculo: a comparacao normaliza antes.
 */
export const MARCAS_DE_RASCUNHO = [
  "placeholder offline para",
  "substituir quando openai",
  "paragrafo de aprofundamento",
  "parágrafo de aprofundamento",
  "contextualizacao inicial sobre",
  "contextualização inicial sobre",
  "assunto do artigo",
  "introducao ao tema",
  "introdução ao tema",
  "sera expandido em revisao",
  "será expandido em revisão",
  "traducao placeholder",
  "tradução placeholder",
  "lorem ipsum",
  "[ai]",
  "[ai item",
];

export type PostAvaliavel = {
  status?: string | null;
  title?: string | null;
  content_mdx?: string | null;
  excerpt?: string | null;
  seo_description?: string | null;
  published_at?: string | null;
};

export type Reprovacao = { regra: string; detalhe: string };

/**
 * Conta palavras como o quality-gate conta: sem bloco de codigo, sem sintaxe
 * de imagem, com o texto do link no lugar da URL e sem os sinais de marcacao.
 * Contar o MDX cru inflaria a medida com `##`, `](/filhotes)` e afins.
 */
export function contarPalavras(mdx: string): number {
  const texto = mdx
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|-]/g, " ");

  return texto.split(/\s+/).filter((p) => /[a-zà-ú]/i.test(p)).length;
}

/** Links que apontam para dentro do site — `](/algo)`. */
export function contarLinksInternos(mdx: string): number {
  return [...mdx.matchAll(/\]\(([^)]+)\)/g)].filter((m) => m[1].startsWith("/")).length;
}

/** Minusculo, sem acento e sem os sinais de enfase que partem uma expressao ao meio. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[*_`]/g, "")
    .toLowerCase();
}

/** Mesma faixa do content-guard: abaixo dela e custo de rotina, nao preco de filhote. */
const FAIXA_DE_PRECO_DE_FILHOTE = { min: 4500, max: 20000 };

const PRECOS_DA_TABELA = new Set(
  [
    ...Object.values(TABELA_DE_PRECOS).flatMap(({ macho, femea }) => [macho, femea]),
    ...Object.values(PRECO_POR_SLUG),
  ].map((centavos) => centavos / 100),
);

const AFIRMACOES_SEM_BASE = [
  /todos os (?:nossos )?filhotes (?:sao |foram )?(?:nasc|criad)/,
  /(?:nascid|criad)[oa]s? (?:no nosso|em nosso) canil/,
  /microchip (?:inclu(?:s|id)o|gratis|opcional|sob contratacao)/,
];

/**
 * As regras decididas pela responsavel. Recebe o texto ja normalizado de titulo,
 * resumo, descricao e corpo, um campo por linha.
 */
function reprovacoesDeNegocio(texto: string): Reprovacao[] {
  const reprovacoes: Reprovacao[] = [];

  // Sem a URL do link, e com quebra de linha separando frase: subtitulo tambem conta.
  const frases = texto.replace(/\]\([^)]*\)/g, "]").split(/[\r\n]+|(?<=[.!?])\s+/);
  const semLulu = frases.find(
    (frase) => /spitz\s+alemao/.test(frase) && !/lulu\s+da\s+pomerania/.test(frase),
  );
  if (semLulu) {
    reprovacoes.push({
      regra: "lulu-por-frase",
      detalhe: `frase cita Spitz Alemao sem Lulu da Pomerania: "${semLulu.trim().slice(0, 80)}"`,
    });
  }

  for (const preco of texto.matchAll(/r\$\s*(\d{1,3}(?:\.\d{3})+)(?:,\d{2})?(?:\s+no\s+pix)?/g)) {
    const valor = Number(preco[1].replace(/\./g, ""));
    if (valor < FAIXA_DE_PRECO_DE_FILHOTE.min || valor > FAIXA_DE_PRECO_DE_FILHOTE.max) continue;
    if (!PRECOS_DA_TABELA.has(valor)) {
      reprovacoes.push({ regra: "preco-fora-da-tabela", detalhe: `"${preco[0]}" nao esta na tabela comercial` });
      continue;
    }
    const antes = texto.slice(0, preco.index);
    if (!/a\s+partir\s+de\s+$/.test(antes) || !/,00\s+no\s+pix$/.test(preco[0])) {
      reprovacoes.push({
        regra: "preco-forma",
        detalhe: `"${preco[0]}" fora da forma "A partir de R$ 0.000,00 no PIX"`,
      });
    }
  }

  // "3x ao dia" e rotina de cuidado, nao condicao de pagamento.
  const parcelamento = texto.match(/\b(?:ou|em)\s+(?:ate\s+)?\d+\s*x\b(?!\s+(?:ao|por|na)\b)|\bsem\s+juros\b/);
  if (parcelamento) {
    reprovacoes.push({ regra: "parcelamento", detalhe: `texto cita parcelamento: "${parcelamento[0]}"` });
  }

  const termo = texto.match(/\b(?:adocao|doacao|boutique)\b|cinza[-\s]lobo|wolf\s+sable/);
  if (termo) {
    reprovacoes.push({ regra: "termo-proibido", detalhe: `termo proibido: "${termo[0]}"` });
  }

  for (const padrao of AFIRMACOES_SEM_BASE) {
    const achado = texto.match(padrao);
    if (achado) {
      reprovacoes.push({ regra: "afirmacao-sem-base", detalhe: `afirmacao nao autorizada: "${achado[0]}"` });
    }
  }

  return reprovacoes;
}

/**
 * Devolve tudo que reprova o post. Lista vazia = aprovado.
 *
 * Devolve a lista inteira, e nao o primeiro erro, porque quem publica pelo
 * admin precisa ver de uma vez o que falta — corrigir, tentar de novo e
 * descobrir o proximo problema e o caminho para desistir da revisao.
 */
export function reprovacoesDoPost(post: PostAvaliavel): Reprovacao[] {
  const reprovacoes: Reprovacao[] = [];
  const corpo = post.content_mdx?.trim() ?? "";

  if (!post.title?.trim()) {
    reprovacoes.push({ regra: "title", detalhe: "post sem titulo" });
  }

  // Sem data o post sai no sitemap com o horario do build, e o Google passa a
  // ver o artigo inteiro como republicado a cada deploy.
  if (!post.published_at) {
    reprovacoes.push({ regra: "published_at", detalhe: "post sem data de publicacao" });
  }

  // description do banco mora em dois campos: seo_description tem prioridade,
  // excerpt e o que a listagem mostra quando ela falta.
  if (!post.seo_description?.trim() && !post.excerpt?.trim()) {
    reprovacoes.push({ regra: "description", detalhe: "sem seo_description nem excerpt" });
  }

  reprovacoes.push(
    ...reprovacoesDeNegocio(
      normalizar([post.title, post.excerpt, post.seo_description, corpo].filter(Boolean).join("\n")),
    ),
  );

  if (!corpo) {
    reprovacoes.push({ regra: "conteudo", detalhe: "corpo vazio" });
    return reprovacoes;
  }

  const palavras = contarPalavras(corpo);
  if (palavras < PALAVRAS_MIN) {
    reprovacoes.push({
      regra: "conteudo-fino",
      detalhe: `${palavras} palavras (minimo ${PALAVRAS_MIN})`,
    });
  }

  if (contarLinksInternos(corpo) === 0) {
    reprovacoes.push({
      regra: "link-interno",
      detalhe: "nenhum link interno — artigo e beco sem saida no grafo do site",
    });
  }

  const normalizado = corpo.toLowerCase();
  const marca = MARCAS_DE_RASCUNHO.find((m) => normalizado.includes(m));
  if (marca) {
    reprovacoes.push({
      regra: "rascunho-automatico",
      detalhe: `corpo contem marca de texto gerado sem revisao: "${marca}"`,
    });
  }

  return reprovacoes;
}

/** Atalho para quem so precisa do sim/nao. */
export function postAprovado(post: PostAvaliavel): boolean {
  return reprovacoesDoPost(post).length === 0;
}

/** Uma linha por reprovacao, para log e para a resposta da API do admin. */
export function descreverReprovacoes(reprovacoes: Reprovacao[]): string {
  return reprovacoes.map((r) => `${r.regra}: ${r.detalhe}`).join("; ");
}
