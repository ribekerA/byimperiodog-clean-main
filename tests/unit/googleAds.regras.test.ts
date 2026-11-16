// Regras puras da integracao com o Google Ads.
//
// Estas funcoes decidem coisas que custam dinheiro e que falham em silencio
// quando mudam sem querer: o tipo de correspondencia padrao de uma
// palavra-chave, a estrategia de lance padrao, a ordem das operacoes que criam
// campanha num mutate unico, e a regra que impede lead e WhatsApp de dividirem
// o mesmo label de conversao. Nenhuma delas toca a rede, por isso dao teste.

import { afterEach, describe, expect, it } from "vitest";

import { correspondenciaValida, montarAnuncioRsa, validarTextosRsa } from "@/lib/google-ads/ads";
import { deMicros, filtroDeData, paraMicros, periodoValido } from "@/lib/google-ads/campaigns";
import {
  VERSAO_PADRAO_API,
  developerToken,
  diagnosticoConfiguracao,
  soDigitos,
  versaoApi,
} from "@/lib/google-ads/config";
import { conflitoDeLabels, extrairSendTo } from "@/lib/google-ads/conversions";
import {
  estrategiaValida,
  montarOperacoesDaCampanha,
  validarEntradaCampanha,
} from "@/lib/google-ads/launch";
import { tipoDoResourceName } from "@/lib/google-ads/recommendations";
import { TETO_ORCAMENTO_DIARIO, travaDeAtivacao, travaDeOrcamento } from "@/lib/google-ads/travas";

const ANUNCIO_OK = {
  titulos: ["Lulu da Pomerania", "Filhotes com pedigree", "Entrega com seguranca"],
  descricoes: ["Lulu da Pomerania criado com acompanhamento.", "Fale com o canil hoje mesmo."],
  urlFinal: "https://byimperiodog.com.br/filhotes",
};

function acao(parcial: Partial<Record<string, unknown>>) {
  return {
    id: "1",
    nome: "Lead",
    status: "ENABLED",
    tipo: "WEBPAGE",
    categoria: "SUBMIT_LEAD_FORM",
    principalParaMeta: true,
    idConversao: "AW-123",
    label: "abc",
    sendTo: "AW-123/abc",
    ...parcial,
  } as Parameters<typeof conflitoDeLabels>[0];
}

describe("configuracao", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });

  it("limpa o ID da conta para o formato que o cabecalho aceita", () => {
    // O painel do Google mostra 123-456-7890; o cabecalho login-customer-id
    // recusa o hifen com um erro generico de autorizacao.
    expect(soDigitos("123-456-7890")).toBe("1234567890");
    expect(soDigitos(" 987 654 3210 ")).toBe("9876543210");
    expect(soDigitos("sem numero")).toBeNull();
    expect(soDigitos(null)).toBeNull();
  });

  it("ignora versao de API mal preenchida em vez de montar uma URL invalida", () => {
    process.env.GOOGLE_ADS_API_VERSION = "v27";
    expect(versaoApi()).toBe("v27");
    process.env.GOOGLE_ADS_API_VERSION = "v26_1";
    expect(versaoApi()).toBe("v26_1");
    process.env.GOOGLE_ADS_API_VERSION = "../../admin";
    expect(versaoApi()).toBe(VERSAO_PADRAO_API);
    process.env.GOOGLE_ADS_API_VERSION = "";
    expect(versaoApi()).toBe(VERSAO_PADRAO_API);
  });

  it("aponta exatamente qual variavel falta, sem lancar", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const vazio = diagnosticoConfiguracao();
    expect(vazio.pronto).toBe(false);
    expect(vazio.faltando).toEqual(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]);

    process.env.GOOGLE_CLIENT_ID = "x";
    process.env.GOOGLE_CLIENT_SECRET = "y";
    expect(diagnosticoConfiguracao().pronto).toBe(true);
  });

  it("nao exige developer token, que o Google desligou em 09/09/2026", () => {
    // Enquanto developerToken() lancava, a tela ficava travada no diagnostico
    // pedindo uma credencial que a API nao le mais -- e o nivel de acesso, que
    // e o que de fato decide, mora no projeto do Google Cloud.
    delete process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    expect(developerToken()).toBeNull();
    expect(diagnosticoConfiguracao().faltando).not.toContain("GOOGLE_ADS_DEVELOPER_TOKEN");

    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = "  22caracteres  ";
    expect(developerToken()).toBe("22caracteres");
  });
});

describe("periodo e micros", () => {
  it("so aceita periodo da lista fechada", () => {
    // O periodo entra concatenado na GAQL. Texto livre aqui seria injecao com
    // leitura da conta de anuncios inteira.
    expect(periodoValido("LAST_7_DAYS")).toBe("LAST_7_DAYS");
    expect(periodoValido("last_7_days")).toBe("LAST_7_DAYS");
    expect(periodoValido("ULTIMOS_7")).toBe("LAST_7_DAYS");
    expect(periodoValido("LAST_30_DAYS' OR 1=1 --")).toBe("LAST_30_DAYS");
    expect(periodoValido(null)).toBe("LAST_30_DAYS");
    // Ano nao e literal do DURING: vira ANO:<aaaa> e so vira intervalo no WHERE.
    const anoAtual = new Date().getUTCFullYear();
    expect(periodoValido("ESTE_ANO")).toBe(`ANO:${anoAtual}`);
    expect(periodoValido("THIS_YEAR")).toBe(`ANO:${anoAtual}`);
    expect(periodoValido("ANO_PASSADO")).toBe(`ANO:${anoAtual - 1}`);
    expect(periodoValido("2026")).toBe("ANO:2026");
    expect(periodoValido("1999")).toBe("LAST_30_DAYS");
    expect(filtroDeData("ANO:2026")).toBe(
      "segments.date BETWEEN '2026-01-01' AND '2026-12-31'",
    );
    expect(filtroDeData("LAST_7_DAYS")).toBe("segments.date DURING LAST_7_DAYS");
  });

  it("converte reais para micros e de volta", () => {
    expect(paraMicros(30)).toBe(30_000_000);
    expect(paraMicros(4.5)).toBe(4_500_000);
    expect(paraMicros(0.01)).toBe(10_000);
    expect(deMicros("4500000")).toBe(4.5);
    expect(deMicros(null)).toBe(0);
    expect(deMicros("nao numero")).toBe(0);
    expect(deMicros(paraMicros(123.45))).toBeCloseTo(123.45, 6);
  });
});

describe("acoes de conversao", () => {
  it("tira o ID e o label de dentro do snippet de evento", () => {
    const snippet = `gtag('event', 'conversion', {'send_to': 'AW-123456789/AbC-D_efG', 'value': 1.0});`;
    expect(extrairSendTo(snippet)).toEqual({
      idConversao: "AW-123456789",
      label: "AbC-D_efG",
      sendTo: "AW-123456789/AbC-D_efG",
    });
  });

  it("aceita send_to com aspas duplas e sem label", () => {
    expect(extrairSendTo(`{"send_to": "AW-999"}`)).toEqual({
      idConversao: "AW-999",
      label: null,
      sendTo: "AW-999",
    });
  });

  it("devolve vazio quando nao ha snippet", () => {
    expect(extrairSendTo(null)).toEqual({ idConversao: null, label: null, sendTo: null });
    expect(extrairSendTo("gtag('config')")).toEqual({ idConversao: null, label: null, sendTo: null });
  });

  it("recusa lead e WhatsApp na mesma acao", () => {
    const mesma = acao({});
    expect(conflitoDeLabels(mesma, mesma)).toMatch(/diferentes/i);
  });

  it("recusa duas acoes que dividem o mesmo label", () => {
    // src/lib/pixels.ts depende de labels distintos para separar "mandou
    // mensagem" de "preencheu formulario".
    const lead = acao({ id: "1" });
    const whats = acao({ id: "2", nome: "WhatsApp" });
    expect(conflitoDeLabels(lead, whats)).toMatch(/mesmo label/i);
  });

  it("recusa acoes de contas AW- diferentes", () => {
    const lead = acao({ id: "1", idConversao: "AW-111", label: "a", sendTo: "AW-111/a" });
    const whats = acao({ id: "2", idConversao: "AW-222", label: "b", sendTo: "AW-222/b" });
    expect(conflitoDeLabels(lead, whats)).toMatch(/contas de conversao diferentes/i);
  });

  it("aprova duas acoes distintas da mesma conta", () => {
    const lead = acao({ id: "1", label: "a", sendTo: "AW-123/a" });
    const whats = acao({ id: "2", label: "b", sendTo: "AW-123/b" });
    expect(conflitoDeLabels(lead, whats)).toBeNull();
  });
});

describe("anuncio responsivo de pesquisa", () => {
  it("aprova um anuncio dentro dos limites", () => {
    expect(validarTextosRsa(ANUNCIO_OK)).toEqual([]);
  });

  it("aponta o titulo longo pelo numero e pelo tamanho", () => {
    const problemas = validarTextosRsa({
      ...ANUNCIO_OK,
      titulos: [...ANUNCIO_OK.titulos, "Lulu da Pomerania com pedigree e entrega"],
    });
    expect(problemas).toContain("O titulo 4 tem 40 caracteres; o limite e 30.");
  });

  it("exige tres titulos e duas descricoes", () => {
    const problemas = validarTextosRsa({ ...ANUNCIO_OK, titulos: ["Um", "Dois"], descricoes: ["So uma"] });
    expect(problemas.some((p) => /pelo menos 3 titulos/.test(p))).toBe(true);
    expect(problemas.some((p) => /pelo menos 2 descricoes/.test(p))).toBe(true);
  });

  it("recusa titulo repetido, que reduz as combinacoes que o Google testa", () => {
    const problemas = validarTextosRsa({
      ...ANUNCIO_OK,
      titulos: ["Lulu da Pomerania", "lulu da pomerania", "Filhotes"],
    });
    expect(problemas.some((p) => /repetidos/.test(p))).toBe(true);
  });

  it("recusa URL final ausente ou invalida", () => {
    expect(validarTextosRsa({ ...ANUNCIO_OK, urlFinal: "" })).toContain("Informe a URL final do anuncio.");
    expect(validarTextosRsa({ ...ANUNCIO_OK, urlFinal: "byimperiodog" })).toContain(
      "A URL final nao e um endereco valido.",
    );
  });

  it("nao manda caminho 2 sem caminho 1, combinacao que a API recusa", () => {
    const so2 = montarAnuncioRsa({ ...ANUNCIO_OK, caminho2: "filhotes" }) as {
      responsiveSearchAd: Record<string, unknown>;
    };
    expect(so2.responsiveSearchAd.path1).toBeUndefined();
    expect(so2.responsiveSearchAd.path2).toBeUndefined();

    const comOs2 = montarAnuncioRsa({ ...ANUNCIO_OK, caminho1: "lulu", caminho2: "filhotes" }) as {
      responsiveSearchAd: Record<string, unknown>;
    };
    expect(comOs2.responsiveSearchAd.path1).toBe("lulu");
    expect(comOs2.responsiveSearchAd.path2).toBe("filhotes");
  });

  it("usa correspondencia de frase como padrao", () => {
    // Ampla e o padrao que o painel do Google empurra e o que gasta com
    // "cachorro gratis" e "doacao".
    expect(correspondenciaValida(undefined)).toBe("PHRASE");
    expect(correspondenciaValida("")).toBe("PHRASE");
    expect(correspondenciaValida("qualquer coisa")).toBe("PHRASE");
    expect(correspondenciaValida("exact")).toBe("EXACT");
    expect(correspondenciaValida("BROAD")).toBe("BROAD");
  });
});

describe("criacao de campanha", () => {
  const entradaOk = {
    nome: "Lulu da Pomerania - Pesquisa",
    orcamentoDiario: 30,
    anuncio: ANUNCIO_OK,
    palavrasChave: [{ texto: "lulu da pomerania filhote" }],
  };

  it("aprova uma entrada completa", () => {
    expect(validarEntradaCampanha(entradaOk)).toEqual([]);
  });

  it("exige pelo menos uma palavra-chave", () => {
    // Campanha de pesquisa sem palavra-chave fica ativa, aprovada e com zero
    // impressao: erra calado.
    expect(validarEntradaCampanha({ ...entradaOk, palavrasChave: [] })).toContain(
      "Informe pelo menos uma palavra-chave.",
    );
  });

  it("exige nome e orcamento maior que zero", () => {
    const problemas = validarEntradaCampanha({ ...entradaOk, nome: "  ", orcamentoDiario: 0 });
    expect(problemas).toContain("Informe o nome da campanha.");
    expect(problemas).toContain("O orcamento diario precisa ser maior que zero.");
  });

  it("exige lance em CPC manual", () => {
    expect(validarEntradaCampanha({ ...entradaOk, estrategia: "MANUAL_CPC" })).toContain(
      "Em CPC manual, informe o lance maximo por clique.",
    );
    expect(
      validarEntradaCampanha({ ...entradaOk, estrategia: "MANUAL_CPC", lanceCpc: 2 }),
    ).toEqual([]);
  });

  it("recusa data de fim anterior a de inicio", () => {
    expect(
      validarEntradaCampanha({ ...entradaOk, dataInicio: "2026-12-01", dataFim: "2026-11-01" }),
    ).toContain("A data de fim e anterior a data de inicio.");
  });

  it("usa maximizar cliques quando a estrategia nao e reconhecida", () => {
    expect(estrategiaValida(null)).toBe("MAXIMIZE_CLICKS");
    expect(estrategiaValida("tROCA")).toBe("MAXIMIZE_CLICKS");
    expect(estrategiaValida("manual_cpc")).toBe("MANUAL_CPC");
    expect(estrategiaValida("MAXIMIZE_CONVERSIONS")).toBe("MAXIMIZE_CONVERSIONS");
  });

  it("encadeia as operacoes pelos IDs negativos, na ordem que a API exige", () => {
    const operacoes = montarOperacoesDaCampanha({
      customerId: "123-456-7890",
      entrada: { ...entradaOk, locais: ["1001364"], negativas: ["gratis"] },
    });

    const tipos = operacoes.map((o) => Object.keys(o)[0]);
    // Orcamento antes da campanha, campanha antes de criterio e grupo, grupo
    // antes do anuncio e das palavras-chave.
    expect(tipos[0]).toBe("campaignBudgetOperation");
    expect(tipos[1]).toBe("campaignOperation");
    expect(tipos.indexOf("adGroupOperation")).toBeLessThan(tipos.indexOf("adGroupAdOperation"));
    expect(tipos.indexOf("adGroupAdOperation")).toBeLessThan(tipos.indexOf("adGroupCriterionOperation"));

    const orcamento = (operacoes[0] as any).campaignBudgetOperation.create;
    expect(orcamento.resourceName).toBe("customers/1234567890/campaignBudgets/-1");
    expect(orcamento.amountMicros).toBe(30_000_000);
    expect(orcamento.explicitlyShared).toBe(false);

    const campanha = (operacoes[1] as any).campaignOperation.create;
    expect(campanha.resourceName).toBe("customers/1234567890/campaigns/-2");
    expect(campanha.campaignBudget).toBe("customers/1234567890/campaignBudgets/-1");
    // Campanha nasce pausada: campanha de pesquisa gasta no minuto em que entra
    // no ar.
    expect(campanha.status).toBe("PAUSED");
    // Parceiros e display desligados: o padrao do Google espalha o orcamento
    // por inventario que nao e busca no Google.
    expect(campanha.networkSettings).toEqual({
      targetGoogleSearch: true,
      targetSearchNetwork: false,
      targetContentNetwork: false,
      targetPartnerSearchNetwork: false,
    });

    const grupo = operacoes.find((o) => "adGroupOperation" in o) as any;
    expect(grupo.adGroupOperation.create.campaign).toBe("customers/1234567890/campaigns/-2");
    expect(grupo.adGroupOperation.create.resourceName).toBe("customers/1234567890/adGroups/-3");

    const anuncio = operacoes.find((o) => "adGroupAdOperation" in o) as any;
    expect(anuncio.adGroupAdOperation.create.adGroup).toBe("customers/1234567890/adGroups/-3");

    const palavra = operacoes.find((o) => "adGroupCriterionOperation" in o) as any;
    expect(palavra.adGroupCriterionOperation.create.keyword).toEqual({
      text: "lulu da pomerania filhote",
      matchType: "PHRASE",
    });

    const criterios = operacoes.filter((o) => "campaignCriterionOperation" in o) as any[];
    const negativa = criterios.find((o) => o.campaignCriterionOperation.create.negative === true);
    expect(negativa.campaignCriterionOperation.create.keyword).toEqual({
      text: "gratis",
      matchType: "BROAD",
    });
    const local = criterios.find((o) => o.campaignCriterionOperation.create.location);
    expect(local.campaignCriterionOperation.create.location.geoTargetConstant).toBe(
      "geoTargetConstants/1001364",
    );
  });

  it("segmenta Brasil e portugues quando nada e escolhido", () => {
    const operacoes = montarOperacoesDaCampanha({ customerId: "1234567890", entrada: entradaOk }) as any[];
    const criterios = operacoes
      .filter((o) => "campaignCriterionOperation" in o)
      .map((o) => o.campaignCriterionOperation.create);
    expect(criterios.some((c: any) => c.location?.geoTargetConstant === "geoTargetConstants/2076")).toBe(
      true,
    );
    expect(criterios.some((c: any) => c.language?.languageConstant === "languageConstants/1014")).toBe(
      true,
    );
  });

  it("aplica o lance de CPC no grupo somente em CPC manual", () => {
    const manual = montarOperacoesDaCampanha({
      customerId: "1234567890",
      entrada: { ...entradaOk, estrategia: "MANUAL_CPC", lanceCpc: 2.5 },
    }).find((o) => "adGroupOperation" in o) as any;
    expect(manual.adGroupOperation.create.cpcBidMicros).toBe(2_500_000);

    const automatico = montarOperacoesDaCampanha({
      customerId: "1234567890",
      entrada: entradaOk,
    }).find((o) => "adGroupOperation" in o) as any;
    expect(automatico.adGroupOperation.create.cpcBidMicros).toBeUndefined();
  });
});

describe("recomendacoes", () => {
  it("le o tipo do proprio resource name", () => {
    // O tipo vem do resource name, nao do corpo da requisicao: e isso que
    // impede a tela de burlar a confirmacao de aumento de gasto.
    expect(tipoDoResourceName("customers/123/recommendations/CAMPAIGN_BUDGET~456")).toBe(
      "CAMPAIGN_BUDGET",
    );
    expect(tipoDoResourceName("customers/123/recommendations/SEARCH_PARTNERS_OPT_IN~9")).toBe(
      "SEARCH_PARTNERS_OPT_IN",
    );
    expect(tipoDoResourceName("customers/123/campaigns/456")).toBeNull();
    expect(tipoDoResourceName("")).toBeNull();
  });
});

describe("travas de gasto", () => {
  it("ativar campanha sem confirmacao devolve 409, e com confirmacao passa", () => {
    expect(travaDeAtivacao({ status: "ENABLED" })?.status).toBe(409);
    expect(travaDeAtivacao({ status: "ENABLED", confirmado: false })?.corpo.error).toBe(
      "confirmacao_necessaria",
    );
    expect(travaDeAtivacao({ status: "ENABLED", confirmado: true })).toBeNull();
  });

  it("pausar e remover nunca pedem confirmacao: parar de gastar tem de ser um clique", () => {
    expect(travaDeAtivacao({ status: "PAUSED" })).toBeNull();
    expect(travaDeAtivacao({ status: "REMOVED" })).toBeNull();
  });

  it("orcamento acima do teto e recusado mesmo confirmado", () => {
    const trava = travaDeOrcamento({
      valorDiario: TETO_ORCAMENTO_DIARIO + 0.01,
      confirmado: true,
      campanhasAfetadas: ["A"],
    });
    expect(trava?.status).toBe(400);
    expect(trava?.corpo.error).toBe("orcamento_acima_do_teto");
  });

  it("orcamento dentro do teto pede confirmacao e diz o valor", () => {
    const trava = travaDeOrcamento({ valorDiario: 45.5, campanhasAfetadas: ["A"] });
    expect(trava?.status).toBe(409);
    expect(trava?.corpo.aviso).toContain("R$ 45,50 por dia");
    expect(trava?.corpo.aviso).not.toContain("compartilhado");
    expect(
      travaDeOrcamento({ valorDiario: TETO_ORCAMENTO_DIARIO, confirmado: true, campanhasAfetadas: ["A"] }),
    ).toBeNull();
  });

  it("orcamento compartilhado e avisado antes de aplicar, com o nome das campanhas", () => {
    const trava = travaDeOrcamento({ valorDiario: 30, campanhasAfetadas: ["Busca SP", "Busca RJ"] });
    expect(trava?.corpo.aviso).toContain("2 campanhas");
    expect(trava?.corpo.aviso).toContain("Busca SP, Busca RJ");
  });
});
