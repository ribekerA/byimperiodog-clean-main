// Campanhas: ler com metricas, pausar, reativar e mexer no orcamento.
//
// Duas decisoes deste arquivo valem explicacao, porque as duas foram tomadas
// contra o caminho mais curto:
//
// 1. A lista de campanhas e as metricas vem em DUAS consultas, nao em uma.
//    Juntar metrica e campanha numa consulta so exige um filtro de data, e
//    filtro de data no GAQL descarta a linha inteira quando nao houve
//    impressao no periodo. O resultado seria uma tela de gerenciamento em que
//    campanha pausada e campanha recem-criada simplesmente nao aparecem --
//    justamente as que alguem abriu a tela para encontrar. Com duas consultas,
//    a lista e completa e a metrica ausente vira zero.
//
// 2. O periodo vem de uma lista fechada, nunca do texto recebido. O periodo e
//    concatenado na consulta GAQL; aceitar texto livre ali seria injecao de
//    GAQL, com acesso de leitura a qualquer tabela da conta de anuncios.

import { consultar, mutar, type LinhaGaql } from "./client";

/** Janelas que o GAQL aceita direto no operador DURING. */
export const PERIODOS = {
  HOJE: "TODAY",
  ONTEM: "YESTERDAY",
  ULTIMOS_7: "LAST_7_DAYS",
  ULTIMOS_14: "LAST_14_DAYS",
  ULTIMOS_30: "LAST_30_DAYS",
  ESTE_MES: "THIS_MONTH",
  MES_PASSADO: "LAST_MONTH",
} as const;

export type ChavePeriodo = keyof typeof PERIODOS;

const ANO_MIN = 2000;
const ANO_MAX = 2100;

function anoPedido(chave: string): number | null {
  const agora = new Date().getUTCFullYear();
  if (chave === "ESTE_ANO" || chave === "THIS_YEAR") return agora;
  if (chave === "ANO_PASSADO" || chave === "LAST_YEAR") return agora - 1;
  const achado = /^(?:ANO:)?(\d{4})$/.exec(chave);
  if (!achado) return null;
  const n = Number(achado[1]);
  return n >= ANO_MIN && n <= ANO_MAX ? n : null;
}

/**
 * Normaliza o periodo que chegou pela URL.
 *
 * Devolve ou um literal do DURING ou `ANO:<aaaa>`. O GAQL nao tem literal de
 * ano: `DURING THIS_YEAR` volta "Invalid date literal supplied for DURING
 * operator". Ano vira intervalo em `filtroDeData`.
 *
 * Valor desconhecido cai em 30 dias de proposito -- e o que impede injecao no
 * GAQL, ja que nada cru da URL chega na consulta.
 */
export function periodoValido(valor: string | null | undefined): string {
  const chave = (valor ?? "").trim().toUpperCase();
  const direto = Object.values(PERIODOS).find((p) => p === chave);
  if (direto) return direto;
  const porChave = (PERIODOS as Record<string, string>)[chave];
  if (porChave) return porChave;
  const ano = anoPedido(chave);
  if (ano) return `ANO:${ano}`;
  return PERIODOS.ULTIMOS_30;
}

/**
 * Trecho de WHERE do periodo, para montar a consulta.
 *
 * Existe separado de `periodoValido` porque ano nao cabe no DURING. Recebe
 * sempre o valor ja normalizado.
 */
export function filtroDeData(periodo: string): string {
  const ano = /^ANO:(\d{4})$/.exec(periodo);
  if (ano) return `segments.date BETWEEN '${ano[1]}-01-01' AND '${ano[1]}-12-31'`;
  return `segments.date DURING ${periodo}`;
}

export const MICROS = 1_000_000;

export function paraMicros(valor: number): number {
  return Math.round(valor * MICROS);
}

export function deMicros(micros: number | string | null | undefined): number {
  const n = typeof micros === "string" ? Number(micros) : micros;
  if (!n || Number.isNaN(n)) return 0;
  return n / MICROS;
}

export type Metricas = {
  impressoes: number;
  cliques: number;
  custo: number;
  conversoes: number;
  valorConversoes: number;
  ctr: number;
  cpcMedio: number;
  custoPorConversao: number;
};

export type Campanha = {
  id: string;
  resourceName: string;
  nome: string;
  status: string;
  canal: string;
  estrategiaDeLance: string;
  dataInicio: string | null;
  dataFim: string | null;
  orcamentoResourceName: string | null;
  orcamentoDiario: number;
  metricas: Metricas;
};

const METRICAS_ZERADAS: Metricas = {
  impressoes: 0,
  cliques: 0,
  custo: 0,
  conversoes: 0,
  valorConversoes: 0,
  ctr: 0,
  cpcMedio: 0,
  custoPorConversao: 0,
};

const CAMPOS_CAMPANHA =
  "campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, " +
  // A v26 nao tem mais `campaign.start_date`/`end_date`: viraram
  // `*_date_time`, no formato "aaaa-MM-dd HH:mm:ss". Os nomes antigos derrubam a
  // consulta inteira com "Unrecognized fields in the query".
  "campaign.bidding_strategy_type, campaign.start_date_time, campaign.end_date_time, " +
  "campaign.resource_name, campaign_budget.resource_name, campaign_budget.amount_micros";

const CAMPOS_METRICAS =
  "campaign.id, metrics.impressions, metrics.clicks, metrics.cost_micros, " +
  "metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc";

/** "2026-03-01 00:00:00" -> "2026-03-01". */
function soODia(valor: unknown): string | null {
  const texto = String(valor ?? "").trim();
  return texto ? texto.slice(0, 10) : null;
}

function lerMetricas(linha: LinhaGaql): Metricas {
  const m = linha.metrics ?? {};
  const custo = deMicros(m.costMicros);
  const conversoes = Number(m.conversions ?? 0);
  return {
    impressoes: Number(m.impressions ?? 0),
    cliques: Number(m.clicks ?? 0),
    custo,
    conversoes,
    valorConversoes: Number(m.conversionsValue ?? 0),
    // ctr vem como fracao (0.0412), e a tela mostra porcentagem.
    ctr: Number(m.ctr ?? 0) * 100,
    cpcMedio: deMicros(m.averageCpc),
    custoPorConversao: conversoes > 0 ? custo / conversoes : 0,
  };
}

/** Campanhas da conta com as metricas do periodo. */
export async function listarCampanhas(opts: {
  userId: string;
  customerId: string;
  periodo?: string | null;
  incluirRemovidas?: boolean;
}): Promise<{ periodo: string; campanhas: Campanha[] }> {
  const periodo = periodoValido(opts.periodo);
  const filtro = opts.incluirRemovidas ? "" : " WHERE campaign.status != 'REMOVED'";

  const [linhasCampanha, linhasMetrica] = await Promise.all([
    consultar({
      userId: opts.userId,
      customerId: opts.customerId,
      gaql: `SELECT ${CAMPOS_CAMPANHA} FROM campaign${filtro} ORDER BY campaign.name`,
    }),
    consultar({
      userId: opts.userId,
      customerId: opts.customerId,
      gaql: `SELECT ${CAMPOS_METRICAS} FROM campaign WHERE ${filtroDeData(periodo)}`,
    }),
  ]);

  const porId = new Map<string, Metricas>();
  for (const linha of linhasMetrica) {
    const id = String(linha.campaign?.id ?? "");
    if (id) porId.set(id, lerMetricas(linha));
  }

  const campanhas = linhasCampanha
    .map((linha): Campanha | null => {
      const c = linha.campaign;
      if (!c) return null;
      const id = String(c.id ?? "");
      if (!id) return null;
      const orcamento = linha.campaignBudget ?? {};
      return {
        id,
        resourceName: String(c.resourceName ?? ""),
        nome: String(c.name ?? "").trim() || `Campanha ${id}`,
        status: String(c.status ?? "UNKNOWN"),
        canal: String(c.advertisingChannelType ?? "UNKNOWN"),
        estrategiaDeLance: String(c.biddingStrategyType ?? "UNKNOWN"),
        // Vem com hora; a tela mostra so o dia.
        dataInicio: soODia(c.startDateTime),
        dataFim: soODia(c.endDateTime),
        orcamentoResourceName: orcamento.resourceName ? String(orcamento.resourceName) : null,
        orcamentoDiario: deMicros(orcamento.amountMicros),
        metricas: porId.get(id) ?? { ...METRICAS_ZERADAS },
      };
    })
    .filter((c): c is Campanha => c !== null);

  return { periodo, campanhas };
}

export type StatusCampanha = "ENABLED" | "PAUSED" | "REMOVED";

export function statusValido(valor: string | null | undefined): StatusCampanha | null {
  const v = (valor ?? "").toUpperCase();
  return v === "ENABLED" || v === "PAUSED" || v === "REMOVED" ? v : null;
}

/** Pausa, reativa ou remove uma campanha. */
export async function alterarStatusDaCampanha(opts: {
  userId: string;
  customerId: string;
  campanhaResourceName: string;
  status: StatusCampanha;
  somenteValidar?: boolean;
}) {
  return mutar({
    userId: opts.userId,
    customerId: opts.customerId,
    somenteValidar: opts.somenteValidar,
    operacoes: [
      {
        campaignOperation: {
          update: { resourceName: opts.campanhaResourceName, status: opts.status },
          updateMask: "status",
        },
      },
    ],
  });
}

/**
 * Troca o orcamento diario da campanha.
 *
 * O valor chega em reais e e convertido para micros aqui. O orcamento no
 * Google Ads e DIARIO e compartilhavel: um orcamento usado por varias
 * campanhas muda para todas de uma vez. Quem chama recebe o resource name de
 * volta para poder avisar.
 */
export async function alterarOrcamento(opts: {
  userId: string;
  customerId: string;
  orcamentoResourceName: string;
  valorDiario: number;
  somenteValidar?: boolean;
}) {
  if (!(opts.valorDiario > 0)) {
    throw new Error("orcamento_invalido");
  }
  return mutar({
    userId: opts.userId,
    customerId: opts.customerId,
    somenteValidar: opts.somenteValidar,
    operacoes: [
      {
        campaignBudgetOperation: {
          update: {
            resourceName: opts.orcamentoResourceName,
            amountMicros: paraMicros(opts.valorDiario),
          },
          updateMask: "amountMicros",
        },
      },
    ],
  });
}

/** Quantas campanhas usam um mesmo orcamento -- a tela avisa antes de mudar. */
export async function campanhasQueUsamOrcamento(opts: {
  userId: string;
  customerId: string;
  orcamentoResourceName: string;
}): Promise<string[]> {
  const linhas = await consultar({
    userId: opts.userId,
    customerId: opts.customerId,
    gaql:
      "SELECT campaign.name FROM campaign WHERE campaign.status != 'REMOVED' AND " +
      `campaign_budget.resource_name = '${opts.orcamentoResourceName.replace(/'/g, "")}'`,
  });
  return linhas.map((l) => String(l.campaign?.name ?? "")).filter(Boolean);
}
