// Otimizacao: recomendacoes do Google e relatorio de termos de busca.
//
// As recomendacoes do Google Ads NAO sao todas do mesmo tipo de coisa. Algumas
// corrigem um defeito real (anuncio com forca baixa, campanha sem palavra
// negativa). Outras existem para a conta gastar mais: aumentar orcamento,
// entrar na rede de parceiros, trocar lance manual por automatico. Aplicar a
// lista inteira com um botao "aplicar tudo" -- que e o que a interface do Google
// convida a fazer -- desfaz em um clique as escolhas de launch.ts, que desliga
// rede de parceiros e display de proposito.
//
// Por isso aqui cada recomendacao vem marcada com `aumentaGasto`, e aplicar uma
// dessas exige o parametro explicito. Nao e paranoia: SEARCH_PARTNERS_OPT_IN e
// CAMPAIGN_BUDGET sao exatamente as duas que o painel sugere com mais
// insistencia.
//
// O relatorio de termos de busca entra aqui porque e a otimizacao que de fato
// economiza: mostra o que a pessoa digitou no Google antes de clicar, e e onde
// aparecem as buscas que nao deveriam ter custado nada.

import { deMicros, filtroDeData, periodoValido } from "./campaigns";
import { consultar, requisitar } from "./client";

/**
 * Tipos de recomendacao que elevam o gasto ou afrouxam a segmentacao.
 *
 * Aplicar qualquer um destes muda quanto a conta gasta por dia, nao so a
 * qualidade do anuncio.
 */
export const TIPOS_QUE_AUMENTAM_GASTO = new Set([
  "CAMPAIGN_BUDGET",
  "MOVE_UNUSED_BUDGET",
  "FORECASTING_CAMPAIGN_BUDGET",
  "SEARCH_PARTNERS_OPT_IN",
  "DISPLAY_EXPANSION_OPT_IN",
  "ENHANCED_CPC_OPT_IN",
  "MAXIMIZE_CLICKS_OPT_IN",
  "MAXIMIZE_CONVERSIONS_OPT_IN",
  "TARGET_CPA_OPT_IN",
  "TARGET_ROAS_OPT_IN",
  "RAISE_TARGET_CPA_BID_TOO_LOW",
  "KEYWORD",
  "UPGRADE_SMART_SHOPPING_CAMPAIGN_TO_PERFORMANCE_MAX",
  "DYNAMIC_IMAGE_EXTENSION_OPT_IN",
]);

const RECOMENDACAO_EM_PORTUGUES: Record<string, string> = {
  CAMPAIGN_BUDGET: "Aumentar o orcamento da campanha",
  MOVE_UNUSED_BUDGET: "Mover orcamento nao usado de outra campanha",
  FORECASTING_CAMPAIGN_BUDGET: "Aumentar o orcamento por previsao de demanda",
  KEYWORD: "Adicionar palavras-chave novas",
  TEXT_AD: "Adicionar um anuncio de texto",
  RESPONSIVE_SEARCH_AD: "Criar um anuncio responsivo de pesquisa",
  RESPONSIVE_SEARCH_AD_ASSET: "Adicionar titulos ou descricoes ao anuncio",
  RESPONSIVE_SEARCH_AD_IMPROVE_AD_STRENGTH: "Melhorar a forca do anuncio",
  SEARCH_PARTNERS_OPT_IN: "Ativar a rede de parceiros de pesquisa",
  DISPLAY_EXPANSION_OPT_IN: "Ativar expansao para a rede de display",
  ENHANCED_CPC_OPT_IN: "Ativar CPC otimizado",
  MAXIMIZE_CLICKS_OPT_IN: "Trocar para Maximizar cliques",
  MAXIMIZE_CONVERSIONS_OPT_IN: "Trocar para Maximizar conversoes",
  TARGET_CPA_OPT_IN: "Trocar para CPA desejado",
  TARGET_ROAS_OPT_IN: "Trocar para ROAS desejado",
  OPTIMIZE_AD_ROTATION: "Otimizar a rotacao dos anuncios",
  KEYWORD_MATCH_TYPE: "Mudar o tipo de correspondencia de palavra-chave",
  SEARCH_TERM_MATCH_TYPE: "Adicionar termo de busca como palavra-chave",
  SITELINK_ASSET: "Adicionar links de site",
  CALLOUT_ASSET: "Adicionar frases de destaque",
  CALL_ASSET: "Adicionar extensao de chamada",
  CALL_EXTENSION: "Adicionar extensao de chamada",
  USE_BROAD_MATCH_KEYWORD: "Usar correspondencia ampla",
  IMPROVE_GOOGLE_TAG_COVERAGE: "Corrigir a cobertura da tag do Google",
  LOWER_TARGET_ROAS: "Reduzir o ROAS desejado",
  SET_TARGET_CPA: "Definir um CPA desejado",
  SET_TARGET_ROAS: "Definir um ROAS desejado",
};

export function nomeDaRecomendacao(tipo: string): string {
  return RECOMENDACAO_EM_PORTUGUES[tipo] ?? tipo.replace(/_/g, " ").toLowerCase();
}

export type Recomendacao = {
  resourceName: string;
  tipo: string;
  titulo: string;
  campanhaNome: string | null;
  grupoNome: string | null;
  aumentaGasto: boolean;
  /** Ganho estimado pelo proprio Google, quando ele informa. */
  impactoCliques: number | null;
  impactoImpressoes: number | null;
  impactoCusto: number | null;
  impactoConversoes: number | null;
};

const CAMPOS_RECOMENDACAO =
  // Na v26 so `recommendation.impact` e selecionavel: pedir as folhas de
  // `impact.potential_metrics.*` derruba a consulta com "Unrecognized fields in
  // the query". O MESSAGE inteiro vem com potentialMetrics dentro, que e o que
  // `lerRecomendacao` le.
  "recommendation.resource_name, recommendation.type, recommendation.campaign, " +
  "recommendation.ad_group, recommendation.impact, campaign.name, ad_group.name";

function numeroOuNulo(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

export async function listarRecomendacoes(opts: {
  userId: string;
  customerId: string;
}): Promise<Recomendacao[]> {
  const linhas = await consultar({
    userId: opts.userId,
    customerId: opts.customerId,
    gaql: `SELECT ${CAMPOS_RECOMENDACAO} FROM recommendation`,
  });

  return linhas
    .map((linha): Recomendacao | null => {
      const r = linha.recommendation;
      if (!r?.resourceName) return null;
      const tipo = String(r.type ?? "UNKNOWN");
      const potencial = r.impact?.potentialMetrics ?? {};
      const custoMicros = numeroOuNulo(potencial.costMicros);
      return {
        resourceName: String(r.resourceName),
        tipo,
        titulo: nomeDaRecomendacao(tipo),
        campanhaNome: linha.campaign?.name ? String(linha.campaign.name) : null,
        grupoNome: linha.adGroup?.name ? String(linha.adGroup.name) : null,
        aumentaGasto: TIPOS_QUE_AUMENTAM_GASTO.has(tipo),
        impactoCliques: numeroOuNulo(potencial.clicks),
        impactoImpressoes: numeroOuNulo(potencial.impressions),
        impactoCusto: custoMicros === null ? null : deMicros(custoMicros),
        impactoConversoes: numeroOuNulo(potencial.conversions),
      };
    })
    .filter((r): r is Recomendacao => r !== null)
    // As que nao mexem no gasto vem primeiro: sao as que da para aplicar sem
    // pensar duas vezes.
    .sort((a, b) => Number(a.aumentaGasto) - Number(b.aumentaGasto));
}

/** Tira o tipo de dentro do resource name, para conferir o risco antes de aplicar. */
export function tipoDoResourceName(resourceName: string): string | null {
  // customers/123/recommendations/CAMPAIGN_BUDGET~456
  const achado = resourceName.match(/\/recommendations\/([A-Z_]+)~/);
  return achado ? achado[1] : null;
}

/**
 * Aplica uma recomendacao.
 *
 * Recomendacao que aumenta gasto exige `confirmarAumentoDeGasto: true`. O tipo
 * e conferido pelo proprio resource name, nao pelo que a tela mandou junto --
 * assim nao ha como burlar a confirmacao mandando um tipo diferente no corpo.
 */
export async function aplicarRecomendacao(opts: {
  userId: string;
  customerId: string;
  resourceName: string;
  confirmarAumentoDeGasto?: boolean;
}) {
  const tipo = tipoDoResourceName(opts.resourceName);
  if (tipo && TIPOS_QUE_AUMENTAM_GASTO.has(tipo) && opts.confirmarAumentoDeGasto !== true) {
    const erro = new Error("confirmacao_necessaria") as Error & { tipo: string; titulo: string };
    erro.tipo = tipo;
    erro.titulo = nomeDaRecomendacao(tipo);
    throw erro;
  }

  const cid = opts.customerId.replace(/\D/g, "");
  return requisitar<{ results?: Array<{ resourceName?: string }> }>({
    userId: opts.userId,
    caminho: `/customers/${cid}/recommendations:apply`,
    metodo: "POST",
    corpo: {
      operations: [{ resourceName: opts.resourceName }],
      partialFailure: false,
    },
  });
}

export async function descartarRecomendacao(opts: {
  userId: string;
  customerId: string;
  resourceName: string;
}) {
  const cid = opts.customerId.replace(/\D/g, "");
  return requisitar<{ results?: Array<{ resourceName?: string }> }>({
    userId: opts.userId,
    caminho: `/customers/${cid}/recommendations:dismiss`,
    metodo: "POST",
    corpo: { operations: [{ resourceName: opts.resourceName }] },
  });
}

export type TermoDeBusca = {
  termo: string;
  palavraChave: string | null;
  campanhaNome: string | null;
  grupoNome: string | null;
  status: string;
  impressoes: number;
  cliques: number;
  custo: number;
  conversoes: number;
  /** Clique que custou e nao converteu -- candidato a palavra negativa. */
  desperdicio: boolean;
};

/**
 * O que as pessoas realmente digitaram no Google antes de clicar.
 *
 * E a unica fonte que mostra para onde o dinheiro foi embora: um canil paga por
 * "spitz alemao preco" e tambem por "cachorro para doacao" se nao houver
 * negativa. `desperdicio` marca o que custou e nao converteu, para a tela
 * oferecer o termo como palavra negativa com um clique.
 */
export async function listarTermosDeBusca(opts: {
  userId: string;
  customerId: string;
  periodo?: string | null;
  campanhaId?: string | null;
  minimoCliques?: number;
}): Promise<{ periodo: string; termos: TermoDeBusca[] }> {
  const periodo = periodoValido(opts.periodo);
  const filtros = [filtroDeData(periodo)];
  const campanhaId = (opts.campanhaId ?? "").replace(/\D/g, "");
  if (campanhaId) filtros.push(`campaign.id = ${campanhaId}`);

  const linhas = await consultar({
    userId: opts.userId,
    customerId: opts.customerId,
    gaql:
      "SELECT search_term_view.search_term, search_term_view.status, " +
      "segments.keyword.info.text, campaign.name, ad_group.name, metrics.impressions, " +
      "metrics.clicks, metrics.cost_micros, metrics.conversions FROM search_term_view " +
      `WHERE ${filtros.join(" AND ")} ORDER BY metrics.cost_micros DESC`,
  });

  const minimo = opts.minimoCliques ?? 0;
  const termos = linhas
    .map((linha): TermoDeBusca | null => {
      const v = linha.searchTermView;
      if (!v?.searchTerm) return null;
      const m = linha.metrics ?? {};
      const cliques = Number(m.clicks ?? 0);
      const custo = deMicros(m.costMicros);
      const conversoes = Number(m.conversions ?? 0);
      return {
        termo: String(v.searchTerm),
        palavraChave: linha.segments?.keyword?.info?.text
          ? String(linha.segments.keyword.info.text)
          : null,
        campanhaNome: linha.campaign?.name ? String(linha.campaign.name) : null,
        grupoNome: linha.adGroup?.name ? String(linha.adGroup.name) : null,
        status: String(v.status ?? "UNKNOWN"),
        impressoes: Number(m.impressions ?? 0),
        cliques,
        custo,
        conversoes,
        desperdicio: custo > 0 && conversoes === 0,
      };
    })
    .filter((t): t is TermoDeBusca => t !== null && t.cliques >= minimo);

  return { periodo, termos };
}

export type DesempenhoPalavraChave = {
  id: string;
  resourceName: string;
  texto: string;
  correspondencia: string;
  status: string;
  grupoNome: string | null;
  impressoes: number;
  cliques: number;
  custo: number;
  conversoes: number;
  custoPorConversao: number;
};

/** Palavras-chave com desempenho no periodo, da que mais custou para a que menos. */
export async function listarDesempenhoDePalavrasChave(opts: {
  userId: string;
  customerId: string;
  periodo?: string | null;
  campanhaId?: string | null;
}): Promise<{ periodo: string; palavras: DesempenhoPalavraChave[] }> {
  const periodo = periodoValido(opts.periodo);
  const filtros = [
    filtroDeData(periodo),
    "ad_group_criterion.status != 'REMOVED'",
    "ad_group_criterion.type = 'KEYWORD'",
  ];
  const campanhaId = (opts.campanhaId ?? "").replace(/\D/g, "");
  if (campanhaId) filtros.push(`campaign.id = ${campanhaId}`);

  const linhas = await consultar({
    userId: opts.userId,
    customerId: opts.customerId,
    gaql:
      "SELECT ad_group_criterion.criterion_id, ad_group_criterion.resource_name, " +
      "ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, " +
      "ad_group_criterion.status, ad_group.name, metrics.impressions, metrics.clicks, " +
      "metrics.cost_micros, metrics.conversions FROM keyword_view " +
      `WHERE ${filtros.join(" AND ")} ORDER BY metrics.cost_micros DESC`,
  });

  const palavras = linhas
    .map((linha): DesempenhoPalavraChave | null => {
      const c = linha.adGroupCriterion;
      if (!c?.criterionId) return null;
      const m = linha.metrics ?? {};
      const custo = deMicros(m.costMicros);
      const conversoes = Number(m.conversions ?? 0);
      return {
        id: String(c.criterionId),
        resourceName: String(c.resourceName ?? ""),
        texto: String(c.keyword?.text ?? ""),
        correspondencia: String(c.keyword?.matchType ?? "UNKNOWN"),
        status: String(c.status ?? "UNKNOWN"),
        grupoNome: linha.adGroup?.name ? String(linha.adGroup.name) : null,
        impressoes: Number(m.impressions ?? 0),
        cliques: Number(m.clicks ?? 0),
        custo,
        conversoes,
        custoPorConversao: conversoes > 0 ? custo / conversoes : 0,
      };
    })
    .filter((p): p is DesempenhoPalavraChave => p !== null);

  return { periodo, palavras };
}
