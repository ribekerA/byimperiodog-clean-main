// Grupos de anuncios, anuncios responsivos de pesquisa (RSA) e palavras-chave.
//
// Os limites do RSA estao validados aqui, antes de qualquer chamada de rede, e
// nao por preciosismo: o Google recusa o anuncio inteiro quando um titulo passa
// de 30 caracteres, e a recusa chega como um erro de campo generico no meio de
// uma transacao que tambem criava campanha e orcamento. Conferir antes
// transforma "a criacao falhou" em "o titulo 4 tem 34 caracteres".

import { deMicros, paraMicros } from "./campaigns";
import { consultar, mutar, type LinhaGaql } from "./client";

export const LIMITES_RSA = {
  TITULOS_MIN: 3,
  TITULOS_MAX: 15,
  TITULO_CARACTERES: 30,
  DESCRICOES_MIN: 2,
  DESCRICOES_MAX: 4,
  DESCRICAO_CARACTERES: 90,
  CAMINHO_CARACTERES: 15,
} as const;

export type TextosRsa = {
  titulos: string[];
  descricoes: string[];
  urlFinal: string;
  caminho1?: string | null;
  caminho2?: string | null;
};

/**
 * Confere um RSA contra os limites do Google e devolve a lista de problemas em
 * portugues. Lista vazia significa que da para enviar.
 *
 * Funcao pura de proposito: e o que permite testar a regra sem tocar na API.
 */
export function validarTextosRsa(textos: TextosRsa): string[] {
  const problemas: string[] = [];
  const titulos = textos.titulos.map((t) => t.trim()).filter(Boolean);
  const descricoes = textos.descricoes.map((d) => d.trim()).filter(Boolean);

  if (titulos.length < LIMITES_RSA.TITULOS_MIN) {
    problemas.push(`O anuncio precisa de pelo menos ${LIMITES_RSA.TITULOS_MIN} titulos.`);
  }
  if (titulos.length > LIMITES_RSA.TITULOS_MAX) {
    problemas.push(`O anuncio aceita no maximo ${LIMITES_RSA.TITULOS_MAX} titulos.`);
  }
  titulos.forEach((titulo, i) => {
    if (titulo.length > LIMITES_RSA.TITULO_CARACTERES) {
      problemas.push(
        `O titulo ${i + 1} tem ${titulo.length} caracteres; o limite e ${LIMITES_RSA.TITULO_CARACTERES}.`,
      );
    }
  });

  if (descricoes.length < LIMITES_RSA.DESCRICOES_MIN) {
    problemas.push(`O anuncio precisa de pelo menos ${LIMITES_RSA.DESCRICOES_MIN} descricoes.`);
  }
  if (descricoes.length > LIMITES_RSA.DESCRICOES_MAX) {
    problemas.push(`O anuncio aceita no maximo ${LIMITES_RSA.DESCRICOES_MAX} descricoes.`);
  }
  descricoes.forEach((descricao, i) => {
    if (descricao.length > LIMITES_RSA.DESCRICAO_CARACTERES) {
      problemas.push(
        `A descricao ${i + 1} tem ${descricao.length} caracteres; o limite e ${LIMITES_RSA.DESCRICAO_CARACTERES}.`,
      );
    }
  });

  // Titulo repetido nao e erro de API, e desperdicio: o Google monta as
  // combinacoes a partir desta lista, e duas entradas iguais reduzem o numero
  // de anuncios distintos que ele consegue testar.
  const repetidos = titulos.filter((t, i) => titulos.findIndex((o) => o.toLowerCase() === t.toLowerCase()) !== i);
  if (repetidos.length > 0) {
    problemas.push("Ha titulos repetidos; cada titulo deve ser diferente dos outros.");
  }

  for (const [nome, valor] of [
    ["caminho 1", textos.caminho1],
    ["caminho 2", textos.caminho2],
  ] as const) {
    const texto = (valor ?? "").trim();
    if (texto.length > LIMITES_RSA.CAMINHO_CARACTERES) {
      problemas.push(
        `O ${nome} tem ${texto.length} caracteres; o limite e ${LIMITES_RSA.CAMINHO_CARACTERES}.`,
      );
    }
  }

  const url = (textos.urlFinal ?? "").trim();
  if (!url) {
    problemas.push("Informe a URL final do anuncio.");
  } else {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        problemas.push("A URL final deve comecar com https://.");
      }
    } catch {
      problemas.push("A URL final nao e um endereco valido.");
    }
  }

  return problemas;
}

/** Monta o objeto de anuncio RSA no formato que a API espera. */
export function montarAnuncioRsa(textos: TextosRsa): Record<string, unknown> {
  const titulos = textos.titulos.map((t) => t.trim()).filter(Boolean);
  const descricoes = textos.descricoes.map((d) => d.trim()).filter(Boolean);
  const caminho1 = (textos.caminho1 ?? "").trim();
  const caminho2 = (textos.caminho2 ?? "").trim();

  return {
    finalUrls: [textos.urlFinal.trim()],
    responsiveSearchAd: {
      headlines: titulos.map((text) => ({ text })),
      descriptions: descricoes.map((text) => ({ text })),
      ...(caminho1 ? { path1: caminho1 } : {}),
      // path2 sem path1 e recusado pela API; a condicao evita enviar essa
      // combinacao quando alguem preenche so o segundo campo.
      ...(caminho1 && caminho2 ? { path2: caminho2 } : {}),
    },
  };
}

export type GrupoDeAnuncios = {
  id: string;
  resourceName: string;
  nome: string;
  status: string;
  campanhaId: string;
  campanhaNome: string;
  lanceCpc: number;
};

export async function listarGruposDeAnuncios(opts: {
  userId: string;
  customerId: string;
  campanhaId?: string | null;
}): Promise<GrupoDeAnuncios[]> {
  const filtros = ["ad_group.status != 'REMOVED'"];
  const campanhaId = (opts.campanhaId ?? "").replace(/\D/g, "");
  if (campanhaId) filtros.push(`campaign.id = ${campanhaId}`);

  const linhas = await consultar({
    userId: opts.userId,
    customerId: opts.customerId,
    gaql:
      "SELECT ad_group.id, ad_group.resource_name, ad_group.name, ad_group.status, " +
      "ad_group.cpc_bid_micros, campaign.id, campaign.name FROM ad_group WHERE " +
      `${filtros.join(" AND ")} ORDER BY campaign.name, ad_group.name`,
  });

  return linhas
    .map((linha): GrupoDeAnuncios | null => {
      const g = linha.adGroup;
      if (!g?.id) return null;
      return {
        id: String(g.id),
        resourceName: String(g.resourceName ?? ""),
        nome: String(g.name ?? "").trim() || `Grupo ${g.id}`,
        status: String(g.status ?? "UNKNOWN"),
        campanhaId: String(linha.campaign?.id ?? ""),
        campanhaNome: String(linha.campaign?.name ?? ""),
        lanceCpc: deMicros(g.cpcBidMicros),
      };
    })
    .filter((g): g is GrupoDeAnuncios => g !== null);
}

export type Anuncio = {
  id: string;
  resourceName: string;
  status: string;
  tipo: string;
  forcaDoAnuncio: string;
  grupoId: string;
  grupoNome: string;
  titulos: string[];
  descricoes: string[];
  urlFinal: string | null;
  impressoes: number;
  cliques: number;
  conversoes: number;
};

export async function listarAnuncios(opts: {
  userId: string;
  customerId: string;
  grupoId?: string | null;
  periodo?: string;
}): Promise<Anuncio[]> {
  const filtros = ["ad_group_ad.status != 'REMOVED'"];
  const grupoId = (opts.grupoId ?? "").replace(/\D/g, "");
  if (grupoId) filtros.push(`ad_group.id = ${grupoId}`);

  const linhas = await consultar({
    userId: opts.userId,
    customerId: opts.customerId,
    gaql:
      "SELECT ad_group_ad.ad.id, ad_group_ad.resource_name, ad_group_ad.status, " +
      "ad_group_ad.ad.type, ad_group_ad.ad_strength, " +
      "ad_group_ad.ad.responsive_search_ad.headlines, " +
      "ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.final_urls, " +
      `ad_group.id, ad_group.name FROM ad_group_ad WHERE ${filtros.join(" AND ")}`,
  });

  return linhas
    .map((linha: LinhaGaql): Anuncio | null => {
      const aga = linha.adGroupAd;
      const ad = aga?.ad;
      if (!ad?.id) return null;
      const rsa = ad.responsiveSearchAd ?? {};
      return {
        id: String(ad.id),
        resourceName: String(aga.resourceName ?? ""),
        status: String(aga.status ?? "UNKNOWN"),
        tipo: String(ad.type ?? "UNKNOWN"),
        forcaDoAnuncio: String(aga.adStrength ?? "UNKNOWN"),
        grupoId: String(linha.adGroup?.id ?? ""),
        grupoNome: String(linha.adGroup?.name ?? ""),
        titulos: (rsa.headlines ?? []).map((h: { text?: string }) => String(h.text ?? "")),
        descricoes: (rsa.descriptions ?? []).map((d: { text?: string }) => String(d.text ?? "")),
        urlFinal: Array.isArray(ad.finalUrls) && ad.finalUrls[0] ? String(ad.finalUrls[0]) : null,
        impressoes: 0,
        cliques: 0,
        conversoes: 0,
      };
    })
    .filter((a): a is Anuncio => a !== null);
}

/** Cria um anuncio RSA num grupo que ja existe. */
export async function criarAnuncioRsa(opts: {
  userId: string;
  customerId: string;
  grupoResourceName: string;
  textos: TextosRsa;
  pausado?: boolean;
  somenteValidar?: boolean;
}) {
  const problemas = validarTextosRsa(opts.textos);
  if (problemas.length > 0) {
    const erro = new Error("rsa_invalido") as Error & { problemas: string[] };
    erro.problemas = problemas;
    throw erro;
  }

  return mutar({
    userId: opts.userId,
    customerId: opts.customerId,
    somenteValidar: opts.somenteValidar,
    operacoes: [
      {
        adGroupAdOperation: {
          create: {
            adGroup: opts.grupoResourceName,
            // PAUSED e o padrao de proposito: um anuncio novo entra no ar no
            // instante em que e criado, e revisar depois de comecar a gastar e
            // revisar tarde.
            status: opts.pausado === false ? "ENABLED" : "PAUSED",
            ad: montarAnuncioRsa(opts.textos),
          },
        },
      },
    ],
  });
}

export type StatusAnuncio = "ENABLED" | "PAUSED" | "REMOVED";

export async function alterarStatusDoAnuncio(opts: {
  userId: string;
  customerId: string;
  anuncioResourceName: string;
  status: StatusAnuncio;
  somenteValidar?: boolean;
}) {
  return mutar({
    userId: opts.userId,
    customerId: opts.customerId,
    somenteValidar: opts.somenteValidar,
    operacoes: [
      {
        adGroupAdOperation: {
          update: { resourceName: opts.anuncioResourceName, status: opts.status },
          updateMask: "status",
        },
      },
    ],
  });
}

export type TipoCorrespondencia = "EXACT" | "PHRASE" | "BROAD";

export function correspondenciaValida(valor: string | null | undefined): TipoCorrespondencia {
  const v = (valor ?? "").toUpperCase();
  return v === "EXACT" || v === "BROAD" ? v : "PHRASE";
}

/**
 * Adiciona palavras-chave a um grupo.
 *
 * O padrao e correspondencia de FRASE. Ampla e o que o painel do Google sugere
 * sozinho e tambem o que mais gasta com busca sem relacao nenhuma -- num canil
 * isso vira clique de quem procurou "cachorro gratis" ou "doacao". Quem quiser
 * ampla pede explicitamente.
 */
export async function adicionarPalavrasChave(opts: {
  userId: string;
  customerId: string;
  grupoResourceName: string;
  palavras: Array<{ texto: string; correspondencia?: string }>;
  somenteValidar?: boolean;
}) {
  const operacoes = opts.palavras
    .map((p) => ({ texto: p.texto.trim(), correspondencia: correspondenciaValida(p.correspondencia) }))
    .filter((p) => p.texto.length > 0)
    .map((p) => ({
      adGroupCriterionOperation: {
        create: {
          adGroup: opts.grupoResourceName,
          status: "ENABLED",
          keyword: { text: p.texto, matchType: p.correspondencia },
        },
      },
    }));

  if (operacoes.length === 0) throw new Error("sem_palavras_chave");

  return mutar({
    userId: opts.userId,
    customerId: opts.customerId,
    somenteValidar: opts.somenteValidar,
    operacoes,
  });
}

/** Palavras-chave negativas no nivel da campanha. */
export async function adicionarNegativas(opts: {
  userId: string;
  customerId: string;
  campanhaResourceName: string;
  palavras: string[];
  somenteValidar?: boolean;
}) {
  const operacoes = opts.palavras
    .map((p) => p.trim())
    .filter(Boolean)
    .map((texto) => ({
      campaignCriterionOperation: {
        create: {
          campaign: opts.campanhaResourceName,
          negative: true,
          keyword: { text: texto, matchType: "BROAD" },
        },
      },
    }));

  if (operacoes.length === 0) throw new Error("sem_palavras_chave");

  return mutar({
    userId: opts.userId,
    customerId: opts.customerId,
    somenteValidar: opts.somenteValidar,
    operacoes,
  });
}

/** Lance de CPC do grupo, em reais. */
export async function alterarLanceDoGrupo(opts: {
  userId: string;
  customerId: string;
  grupoResourceName: string;
  lanceCpc: number;
  somenteValidar?: boolean;
}) {
  if (!(opts.lanceCpc > 0)) throw new Error("lance_invalido");
  return mutar({
    userId: opts.userId,
    customerId: opts.customerId,
    somenteValidar: opts.somenteValidar,
    operacoes: [
      {
        adGroupOperation: {
          update: {
            resourceName: opts.grupoResourceName,
            cpcBidMicros: paraMicros(opts.lanceCpc),
          },
          updateMask: "cpcBidMicros",
        },
      },
    ],
  });
}
