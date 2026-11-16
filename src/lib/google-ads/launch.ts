// Criacao de campanha completa numa unica transacao.
//
// Uma campanha de pesquisa que de fato funciona precisa de SEIS objetos
// (orcamento, campanha, segmentacao de local, segmentacao de idioma, grupo de
// anuncios, anuncio e palavras-chave), e cada um depende do anterior. Criar um
// por chamada deixa lixo no meio do caminho toda vez que o quinto passo falha:
// orcamento orfao, campanha sem anuncio, campanha ativa gastando sem anuncio
// nenhum para mostrar.
//
// O endpoint googleAds:mutate aceita todos os passos juntos, usando ID
// temporario NEGATIVO para um objeto citar outro que ainda nao existe
// (`customers/123/campaignBudgets/-1`). Com partialFailure: false (ver
// client.ts), ou nasce tudo, ou nao nasce nada.
//
// A campanha nasce PAUSADA, sempre. Campanha de pesquisa comeca a gastar no
// minuto em que entra no ar, e conferir texto, palavra-chave e local depois do
// primeiro clique e conferir tarde.

import { montarAnuncioRsa, validarTextosRsa, correspondenciaValida, type TextosRsa } from "./ads";
import { paraMicros } from "./campaigns";
import { mutar, requisitar } from "./client";

/** Estrategias de lance oferecidas pela tela. */
export const ESTRATEGIAS = {
  MAXIMIZE_CONVERSIONS: "maximizeConversions",
  MAXIMIZE_CLICKS: "targetSpend",
  MANUAL_CPC: "manualCpc",
} as const;

export type ChaveEstrategia = keyof typeof ESTRATEGIAS;

export function estrategiaValida(valor: string | null | undefined): ChaveEstrategia {
  const v = (valor ?? "").toUpperCase();
  if (v === "MAXIMIZE_CLICKS" || v === "MANUAL_CPC" || v === "MAXIMIZE_CONVERSIONS") return v;
  // MAXIMIZE_CLICKS como padrao: Maximizar conversoes sem historico de
  // conversao na conta gasta o orcamento inteiro aprendendo. Enquanto a conta
  // nao tiver conversao registrada, lance por clique entrega mais.
  return "MAXIMIZE_CLICKS";
}

/** Brasil, no formato que a API usa para segmentacao de local. */
export const GEO_BRASIL = "2076";
/** Portugues, no formato que a API usa para segmentacao de idioma. */
export const IDIOMA_PORTUGUES = "1014";

export type EntradaCampanha = {
  nome: string;
  orcamentoDiario: number;
  estrategia?: string | null;
  /** Lance maximo por clique, em reais. Obrigatorio em MANUAL_CPC. */
  lanceCpc?: number | null;
  /** Teto de gasto diario de conversao, em reais. Opcional. */
  dataInicio?: string | null;
  dataFim?: string | null;
  /** IDs de geoTargetConstant (numeros). Vazio = Brasil. */
  locais?: string[] | null;
  /** IDs de languageConstant. Vazio = portugues. */
  idiomas?: string[] | null;
  nomeDoGrupo?: string | null;
  anuncio: TextosRsa;
  palavrasChave?: Array<{ texto: string; correspondencia?: string }> | null;
  negativas?: string[] | null;
};

function dataValida(valor: string | null | undefined): string | null {
  const v = (valor ?? "").trim();
  // A API quer AAAA-MM-DD. Qualquer outra coisa e devolvida como nula para a
  // campanha herdar o padrao (comeca hoje, sem data de fim).
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** Confere a entrada inteira e devolve os problemas em portugues. */
export function validarEntradaCampanha(entrada: EntradaCampanha): string[] {
  const problemas: string[] = [];

  if (!entrada.nome?.trim()) problemas.push("Informe o nome da campanha.");
  if (!(entrada.orcamentoDiario > 0)) {
    problemas.push("O orcamento diario precisa ser maior que zero.");
  }

  const estrategia = estrategiaValida(entrada.estrategia);
  if (estrategia === "MANUAL_CPC" && !(Number(entrada.lanceCpc) > 0)) {
    problemas.push("Em CPC manual, informe o lance maximo por clique.");
  }

  const inicio = dataValida(entrada.dataInicio);
  const fim = dataValida(entrada.dataFim);
  if (inicio && fim && fim < inicio) {
    problemas.push("A data de fim e anterior a data de inicio.");
  }

  problemas.push(...validarTextosRsa(entrada.anuncio));

  const palavras = (entrada.palavrasChave ?? []).filter((p) => p.texto?.trim());
  if (palavras.length === 0) {
    // Sem palavra-chave, a campanha de pesquisa nao tem como aparecer -- fica
    // ativa, com anuncio aprovado, e zero impressao. Erra calado.
    problemas.push("Informe pelo menos uma palavra-chave.");
  }

  return problemas;
}

type Operacao = Record<string, unknown>;

/**
 * Monta a lista de operacoes da criacao completa.
 *
 * Separada do envio para poder ser conferida em teste sem rede: a ordem das
 * operacoes e o encadeamento dos IDs negativos sao exatamente o que quebra em
 * silencio quando alguem mexe neste arquivo.
 */
export function montarOperacoesDaCampanha(opts: {
  customerId: string;
  entrada: EntradaCampanha;
}): Operacao[] {
  const cid = opts.customerId.replace(/\D/g, "");
  const e = opts.entrada;
  const estrategia = estrategiaValida(e.estrategia);

  const refOrcamento = `customers/${cid}/campaignBudgets/-1`;
  const refCampanha = `customers/${cid}/campaigns/-2`;
  const refGrupo = `customers/${cid}/adGroups/-3`;

  const operacoes: Operacao[] = [];

  operacoes.push({
    campaignBudgetOperation: {
      create: {
        resourceName: refOrcamento,
        // O nome do orcamento tem de ser unico na conta, e o sufixo de tempo
        // evita o erro DUPLICATE_NAME quando alguem recria uma campanha com o
        // mesmo nome depois de remover a primeira.
        name: `${e.nome.trim()} - orcamento ${Date.now()}`,
        amountMicros: paraMicros(e.orcamentoDiario),
        deliveryMethod: "STANDARD",
        // explicitlyShared false: orcamento proprio desta campanha. Orcamento
        // compartilhado faz um aumento aqui mexer no gasto de outras campanhas.
        explicitlyShared: false,
      },
    },
  });

  const campanha: Record<string, unknown> = {
    resourceName: refCampanha,
    name: e.nome.trim(),
    status: "PAUSED",
    advertisingChannelType: "SEARCH",
    campaignBudget: refOrcamento,
    // Rede de pesquisa e parceiros ficam DESLIGADAS, e display tambem. O padrao
    // do Google liga as tres, o que espalha o orcamento por inventario que nao
    // e busca no Google -- e o motivo classico de "gastou e nao trouxe lead".
    networkSettings: {
      targetGoogleSearch: true,
      targetSearchNetwork: false,
      targetContentNetwork: false,
      targetPartnerSearchNetwork: false,
    },
    [ESTRATEGIAS[estrategia]]:
      estrategia === "MANUAL_CPC" ? { enhancedCpcEnabled: false } : {},
  };

  const inicio = dataValida(e.dataInicio);
  const fim = dataValida(e.dataFim);
  // Os campos pedem "aaaa-MM-dd HH:mm:ss". Dia inteiro: comeca em 00:00:00 e
  // termina em 23:59:59, senao a campanha para no meio do ultimo dia.
  if (inicio) campanha.startDateTime = `${inicio} 00:00:00`;
  if (fim) campanha.endDateTime = `${fim} 23:59:59`;

  operacoes.push({ campaignOperation: { create: campanha } });

  const locais = (e.locais ?? []).map((l) => String(l).replace(/\D/g, "")).filter(Boolean);
  for (const geo of locais.length > 0 ? locais : [GEO_BRASIL]) {
    operacoes.push({
      campaignCriterionOperation: {
        create: {
          campaign: refCampanha,
          location: { geoTargetConstant: `geoTargetConstants/${geo}` },
        },
      },
    });
  }

  const idiomas = (e.idiomas ?? []).map((i) => String(i).replace(/\D/g, "")).filter(Boolean);
  for (const idioma of idiomas.length > 0 ? idiomas : [IDIOMA_PORTUGUES]) {
    operacoes.push({
      campaignCriterionOperation: {
        create: {
          campaign: refCampanha,
          language: { languageConstant: `languageConstants/${idioma}` },
        },
      },
    });
  }

  for (const negativa of (e.negativas ?? []).map((n) => n.trim()).filter(Boolean)) {
    operacoes.push({
      campaignCriterionOperation: {
        create: {
          campaign: refCampanha,
          negative: true,
          keyword: { text: negativa, matchType: "BROAD" },
        },
      },
    });
  }

  const grupo: Record<string, unknown> = {
    resourceName: refGrupo,
    campaign: refCampanha,
    name: (e.nomeDoGrupo ?? "").trim() || `${e.nome.trim()} - grupo 1`,
    status: "ENABLED",
    type: "SEARCH_STANDARD",
  };
  if (estrategia === "MANUAL_CPC" && Number(e.lanceCpc) > 0) {
    grupo.cpcBidMicros = paraMicros(Number(e.lanceCpc));
  }
  operacoes.push({ adGroupOperation: { create: grupo } });

  operacoes.push({
    adGroupAdOperation: {
      create: {
        adGroup: refGrupo,
        status: "ENABLED",
        ad: montarAnuncioRsa(e.anuncio),
      },
    },
  });

  for (const palavra of e.palavrasChave ?? []) {
    const texto = palavra.texto?.trim();
    if (!texto) continue;
    operacoes.push({
      adGroupCriterionOperation: {
        create: {
          adGroup: refGrupo,
          status: "ENABLED",
          keyword: { text: texto, matchType: correspondenciaValida(palavra.correspondencia) },
        },
      },
    });
  }

  return operacoes;
}

/**
 * Cria orcamento, campanha, segmentacao, grupo, anuncio e palavras-chave de uma
 * vez. A campanha nasce pausada; ativar e um segundo passo deliberado.
 */
export async function criarCampanhaCompleta(opts: {
  userId: string;
  customerId: string;
  entrada: EntradaCampanha;
  somenteValidar?: boolean;
}): Promise<{
  resultados: Array<Record<string, any>>;
  validado: boolean;
  campanhaResourceName: string | null;
}> {
  const problemas = validarEntradaCampanha(opts.entrada);
  if (problemas.length > 0) {
    const erro = new Error("campanha_invalida") as Error & { problemas: string[] };
    erro.problemas = problemas;
    throw erro;
  }

  const operacoes = montarOperacoesDaCampanha({
    customerId: opts.customerId,
    entrada: opts.entrada,
  });

  const resposta = await mutar({
    userId: opts.userId,
    customerId: opts.customerId,
    operacoes,
    somenteValidar: opts.somenteValidar,
  });

  const daCampanha = resposta.resultados.find((r) => r?.campaignResult?.resourceName);
  return {
    ...resposta,
    campanhaResourceName: daCampanha?.campaignResult?.resourceName ?? null,
  };
}

export type LocalSugerido = {
  id: string;
  nome: string;
  tipo: string;
  alcance: number;
  paisCodigo: string | null;
};

/**
 * Traduz nome de cidade em ID de segmentacao ("Braganca Paulista" -> 1001773).
 *
 * A tela precisa disso porque a API nao aceita nome de lugar: o criterio de
 * local e um ID numerico de um catalogo do Google. Sem a busca, alguem teria de
 * procurar o numero numa planilha de 100 mil linhas que o Google publica.
 */
export async function sugerirLocais(opts: {
  userId: string;
  nomes: string[];
  paisCodigo?: string | null;
}): Promise<LocalSugerido[]> {
  const nomes = opts.nomes.map((n) => n.trim()).filter(Boolean).slice(0, 25);
  if (nomes.length === 0) return [];

  const resposta = await requisitar<{
    geoTargetConstantSuggestions?: Array<{
      geoTargetConstant?: {
        resourceName?: string;
        id?: string;
        name?: string;
        targetType?: string;
        countryCode?: string;
      };
      reach?: string;
    }>;
  }>({
    userId: opts.userId,
    caminho: "/geoTargetConstants:suggest",
    metodo: "POST",
    corpo: {
      locale: "pt",
      countryCode: (opts.paisCodigo ?? "BR").toUpperCase(),
      locationNames: { names: nomes },
    },
  });

  return (resposta.geoTargetConstantSuggestions ?? [])
    .map((s): LocalSugerido | null => {
      const g = s.geoTargetConstant;
      if (!g?.id) return null;
      return {
        id: String(g.id),
        nome: String(g.name ?? ""),
        tipo: String(g.targetType ?? ""),
        alcance: Number(s.reach ?? 0),
        paisCodigo: g.countryCode ? String(g.countryCode) : null,
      };
    })
    .filter((l): l is LocalSugerido => l !== null)
    .sort((a, b) => b.alcance - a.alcance);
}
