/**
 * Relacionados dos artigos do blog, escolhidos por assunto.
 *
 * Por que existe: a busca antiga comparava tags, e quase toda tag ou é única ou
 * está em todos os artigos ("spitz alemão anão"). Sem tag útil em comum, caía
 * sempre na mesma lista fixa. Medido em produção em 06/11/2026: quatro artigos
 * recebiam cerca de 30 links cada e 20 dos 31 não recebiam nenhum, inclusive
 * alimentação, vacinas e peso, que apareciam só para quem já estava neles.
 *
 * O assunto vem de content/search-topics.ts, o mapa editorial que já diz a que
 * tema cada artigo pertence. A distribuição é determinística: a mesma lista de
 * artigos sempre gera os mesmos blocos, sem sorteio e sem nada lido em execução.
 */
import { SEARCH_TOPICS, type SearchTopic } from "@/content/search-topics";

export type ArtigoRelacionavel = {
  slug: string;
  category?: string | null;
  tags?: readonly unknown[] | null;
};

/** Quantos links o bloco do artigo mostra. É nessas posições que a carga é dividida. */
export const RELACIONADOS_VISIVEIS = 4;
const RELACIONADOS_POR_ARTIGO = 6;

const PESO_MESMO_TEMA = 6;
const PESO_TEMA_VIZINHO = 3;
const PESO_MESMO_GRUPO = 2;
const PESO_MESMA_CATEGORIA = 1;
const PESO_TAG_RARA = 1;
const TETO_TAGS_RARAS = 3;

/** Tag presente em mais que esta fração dos artigos não diz nada sobre o assunto. */
const FRACAO_DE_TAG_GENERICA = 0.25;

/**
 * Quanto cada link que o artigo já recebeu desconta na próxima escolha. Um
 * artigo do mesmo tema (6) ainda vence um de outro grupo (2) até receber quatro
 * links, e é aí que a carga passa para os demais.
 */
const DESCONTO_POR_LINK_RECEBIDO = 1;

const temasDoArtigo = (slug: string): readonly SearchTopic[] => {
  const caminho = `/blog/${slug}`;
  return SEARCH_TOPICS.filter(
    (tema) => tema.href === caminho || (tema.supportingPaths ?? []).includes(caminho)
  );
};

const normalizarTag = (tag: unknown) => String(tag).trim().toLowerCase();

const normalizarCategoria = (categoria: ArtigoRelacionavel["category"]) =>
  (categoria ?? "").trim().toLowerCase();

function criarMedidorDeAfinidade(artigos: readonly ArtigoRelacionavel[]) {
  const temas = new Map(artigos.map((a) => [a.slug, temasDoArtigo(a.slug)]));

  const presenca = new Map<string, number>();
  for (const artigo of artigos) {
    for (const tag of new Set((artigo.tags ?? []).map(normalizarTag))) {
      presenca.set(tag, (presenca.get(tag) ?? 0) + 1);
    }
  }
  const tagGenerica = (tag: string) =>
    (presenca.get(tag) ?? 0) > artigos.length * FRACAO_DE_TAG_GENERICA;
  const tagsRaras = new Map(
    artigos.map((a) => [
      a.slug,
      new Set((a.tags ?? []).map(normalizarTag).filter((tag) => !tagGenerica(tag))),
    ])
  );

  return (origem: ArtigoRelacionavel, destino: ArtigoRelacionavel): number => {
    const temasOrigem = temas.get(origem.slug) ?? [];
    const temasDestino = temas.get(destino.slug) ?? [];
    let pontos = 0;

    if (temasOrigem.some((t) => temasDestino.some((d) => d.id === t.id))) {
      pontos += PESO_MESMO_TEMA;
    }
    if (
      temasOrigem.some((t) => temasDestino.some((d) => (t.related ?? []).includes(d.id))) ||
      temasDestino.some((d) => temasOrigem.some((t) => (d.related ?? []).includes(t.id)))
    ) {
      pontos += PESO_TEMA_VIZINHO;
    }
    if (temasOrigem.some((t) => temasDestino.some((d) => d.cluster === t.cluster))) {
      pontos += PESO_MESMO_GRUPO;
    }

    const categoria = normalizarCategoria(origem.category);
    if (categoria && categoria === normalizarCategoria(destino.category)) {
      pontos += PESO_MESMA_CATEGORIA;
    }

    const destinoTags = tagsRaras.get(destino.slug) ?? new Set<string>();
    let emComum = 0;
    for (const tag of tagsRaras.get(origem.slug) ?? []) {
      if (destinoTags.has(tag)) emComum += 1;
    }
    return pontos + Math.min(emComum, TETO_TAGS_RARAS) * PESO_TAG_RARA;
  };
}

/**
 * Monta o bloco de cada artigo em rodadas: a cada rodada, cada artigo fica com o
 * candidato de maior afinidade, descontados os links que esse candidato já tem.
 *
 * `foraDaVitrine` lista artigos que ganham bloco próprio, mas nunca entram no
 * bloco dos outros.
 */
export function montarRelacionadosPorAssunto(
  artigos: readonly ArtigoRelacionavel[],
  foraDaVitrine: ReadonlySet<string> = new Set()
): Map<string, string[]> {
  const ordenados = [...artigos].sort((a, b) => a.slug.localeCompare(b.slug));
  const afinidade = criarMedidorDeAfinidade(ordenados);
  const candidatos = ordenados.filter((a) => !foraDaVitrine.has(a.slug));
  const recebidos = new Map(candidatos.map((a) => [a.slug, 0]));
  const blocos = new Map(ordenados.map((a) => [a.slug, [] as string[]]));

  for (let rodada = 0; rodada < RELACIONADOS_POR_ARTIGO; rodada += 1) {
    for (const origem of ordenados) {
      const bloco = blocos.get(origem.slug)!;
      let melhor: { slug: string; nota: number } | null = null;

      for (const destino of candidatos) {
        if (destino.slug === origem.slug || bloco.includes(destino.slug)) continue;
        const pontos = afinidade(origem, destino);
        // Sem nada em comum, só entra se não houver mais nada: nota bem abaixo
        // de qualquer candidato com afinidade, por mais links que ele já tenha.
        const nota =
          (pontos > 0 ? pontos : -1000) - (recebidos.get(destino.slug) ?? 0) * DESCONTO_POR_LINK_RECEBIDO;
        if (!melhor || nota > melhor.nota) melhor = { slug: destino.slug, nota };
      }

      if (melhor) {
        bloco.push(melhor.slug);
        recebidos.set(melhor.slug, (recebidos.get(melhor.slug) ?? 0) + 1);
      }
    }
  }

  // Dentro das posições visíveis, o mais próximo do assunto vem primeiro.
  const porArtigo = new Map(ordenados.map((a) => [a.slug, a]));
  for (const [slug, bloco] of blocos) {
    const origem = porArtigo.get(slug)!;
    const maisProximoPrimeiro = (a: string, b: string) =>
      afinidade(origem, porArtigo.get(b)!) - afinidade(origem, porArtigo.get(a)!);
    blocos.set(slug, [
      ...bloco.slice(0, RELACIONADOS_VISIVEIS).sort(maisProximoPrimeiro),
      ...bloco.slice(RELACIONADOS_VISIVEIS).sort(maisProximoPrimeiro),
    ]);
  }

  return blocos;
}
