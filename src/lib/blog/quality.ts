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
 */

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
