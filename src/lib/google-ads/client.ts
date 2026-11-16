// Cliente REST da API do Google Ads.
//
// Por que REST e nao a biblioteca oficial: o pacote `googleapis` que o projeto
// ja usa para Search Console NAO cobre a API do Google Ads (ela mora num
// pacote separado, com gRPC e protobuf). As integracoes de GA4 e GTM deste
// repositorio ja falam REST na unha com `fetch`, e a API do Ads tem endpoint
// REST equivalente. Seguir o mesmo caminho evita arrastar um cliente gRPC para
// dentro de uma funcao serverless da Netlify so por causa de duas chamadas.
//
// Duas regras que este arquivo existe para sustentar:
//
// - O access token do Google vive uma hora. Renovar so quando a resposta der
//   401 significa uma chamada perdida a cada hora de uso; aqui o token e
//   renovado ANTES de expirar e o novo par e gravado, para a proxima
//   requisicao nao repetir o trabalho.
// - O erro da API do Ads vem aninhado em error.details[].errors[].message, e e
//   onde esta a unica informacao util ("conta sem acesso", "campo invalido",
//   "developer token em modo de teste"). Jogar fora esse texto transforma todo
//   problema de configuracao numa falha generica de 500.

import { getIntegrationForUser, upsertIntegrationTokens } from "@/lib/tracking/integrations";
import { getProvider } from "@/lib/tracking/providers/registry";
import type { OAuthTokens } from "@/lib/tracking/providers/types";

import { baseApi, developerToken, loginCustomerId, soDigitos } from "./config";

export class ErroGoogleAds extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalhes: string[];

  constructor(mensagem: string, opts: { status: number; codigo: string; detalhes?: string[] }) {
    super(mensagem);
    this.name = "ErroGoogleAds";
    this.status = opts.status;
    this.codigo = opts.codigo;
    this.detalhes = opts.detalhes ?? [];
  }
}

type RespostaErro = {
  error?: {
    message?: string;
    status?: string;
    details?: Array<{ errors?: Array<{ message?: string; errorCode?: Record<string, string> }> }>;
  };
};

function extrairMensagens(corpo: unknown): string[] {
  const erro = (corpo as RespostaErro | null)?.error;
  if (!erro) return [];
  const mensagens: string[] = [];
  for (const detalhe of erro.details ?? []) {
    for (const item of detalhe.errors ?? []) {
      if (item.message) mensagens.push(item.message);
    }
  }
  if (mensagens.length === 0 && erro.message) mensagens.push(erro.message);
  return mensagens;
}

/**
 * Devolve um access token valido do usuario admin, renovando quando estiver
 * perto de vencer. A renovacao e gravada para que a proxima chamada ja parta
 * de um token fresco.
 */
export async function tokenDeAcesso(userId: string): Promise<string> {
  const integracao = await getIntegrationForUser("google_ads", userId);
  if (!integracao) {
    throw new ErroGoogleAds("Conta do Google Ads nao conectada.", {
      status: 404,
      codigo: "nao_conectado",
    });
  }

  const agora = Math.floor(Date.now() / 1000);
  const expiraEm = integracao.expires_at
    ? Math.floor(new Date(integracao.expires_at).getTime() / 1000)
    : null;
  const venceLogo = typeof expiraEm === "number" && expiraEm <= agora + 60;

  if (!venceLogo) return integracao.access_token;

  const adapter = getProvider("google_ads");
  if (!integracao.refresh_token || !adapter?.refreshTokens) {
    throw new ErroGoogleAds("A conexao com o Google Ads expirou. Conecte novamente.", {
      status: 401,
      codigo: "reconexao_necessaria",
    });
  }

  const novos: OAuthTokens = await adapter.refreshTokens(integracao.refresh_token);
  await upsertIntegrationTokens({
    userId,
    provider: "google_ads",
    tokens: novos,
    providerAccountId: integracao.provider_account_id,
    metadata: integracao.metadata,
  });
  return novos.accessToken;
}

/**
 * Chamada crua a API com um access token ja em maos.
 *
 * Existe separada de `requisitar` porque o adapter OAuth lista as contas no
 * meio do fluxo de conexao -- momento em que os tokens ainda nao foram
 * gravados no banco e portanto nao ha o que buscar por userId.
 *
 * O login-customer-id so vai junto se houver gerenciador configurado, porque
 * manda-lo em conta sem MCC faz o Google recusar.
 */
export async function requisitarComToken<T>(opts: {
  accessToken: string;
  caminho: string;
  metodo?: "GET" | "POST";
  corpo?: unknown;
}): Promise<T> {
  const token = opts.accessToken;
  const cabecalhos: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  // So vai junto quando existe. O cabecalho e ignorado pela API desde o
  // desligamento de 09/09/2026, e mandar string vazia e pior que nao mandar.
  const tokenDeDesenvolvedor = developerToken();
  if (tokenDeDesenvolvedor) cabecalhos["developer-token"] = tokenDeDesenvolvedor;
  const mcc = loginCustomerId();
  if (mcc) cabecalhos["login-customer-id"] = mcc;

  const resposta = await fetch(`${baseApi()}${opts.caminho}`, {
    method: opts.metodo ?? "GET",
    headers: cabecalhos,
    body: opts.corpo === undefined ? undefined : JSON.stringify(opts.corpo),
    cache: "no-store",
  });

  const texto = await resposta.text();
  let corpo: unknown = null;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    corpo = null;
  }

  if (!resposta.ok) {
    const detalhes = extrairMensagens(corpo);
    const primeira = detalhes[0] || `A API do Google Ads respondeu ${resposta.status}.`;
    throw new ErroGoogleAds(primeira, {
      status: resposta.status,
      codigo: resposta.status === 401 ? "nao_autorizado" : "erro_api",
      detalhes,
    });
  }

  return (corpo ?? {}) as T;
}

/** Mesma chamada, resolvendo o token do admin conectado (renovando se preciso). */
export async function requisitar<T>(opts: {
  userId: string;
  caminho: string;
  metodo?: "GET" | "POST";
  corpo?: unknown;
}): Promise<T> {
  const accessToken = await tokenDeAcesso(opts.userId);
  return requisitarComToken<T>({
    accessToken,
    caminho: opts.caminho,
    metodo: opts.metodo,
    corpo: opts.corpo,
  });
}

export type LinhaGaql = Record<string, any>;

/**
 * Executa uma consulta GAQL e junta todas as paginas.
 *
 * O endpoint `search` devolve um nextPageToken quando ha mais linhas. Ignorar o
 * token funciona ate a conta crescer, e entao a tela passa a mostrar uma lista
 * silenciosamente cortada -- o tipo de bug que so aparece depois que alguem
 * reclama que "sumiu campanha".
 *
 * Nao mandar `pageSize`. A v26 recusa a requisicao inteira com "Setting the page
 * size is not supported" e fixa a pagina em 10000 linhas. O erro vira 400 em toda
 * rota do Ads, e em `accounts.ts` o catch por conta ainda o disfarca de conta sem
 * nome e sem moeda -- parece conta sem permissao, e nao e.
 */
export async function consultar(opts: {
  userId: string;
  customerId: string;
  gaql: string;
  limitePaginas?: number;
}): Promise<LinhaGaql[]> {
  const cid = soDigitos(opts.customerId);
  if (!cid) {
    throw new ErroGoogleAds("ID de conta invalido.", { status: 400, codigo: "conta_invalida" });
  }

  const linhas: LinhaGaql[] = [];
  let pageToken: string | undefined;
  const limite = opts.limitePaginas ?? 20;

  for (let pagina = 0; pagina < limite; pagina += 1) {
    const resposta = await requisitar<{ results?: LinhaGaql[]; nextPageToken?: string }>({
      userId: opts.userId,
      caminho: `/customers/${cid}/googleAds:search`,
      metodo: "POST",
      corpo: { query: opts.gaql, ...(pageToken ? { pageToken } : {}) },
    });
    linhas.push(...(resposta.results ?? []));
    pageToken = resposta.nextPageToken;
    if (!pageToken) break;
  }

  return linhas;
}

export type OperacaoMutate = Record<string, unknown>;

/**
 * Aplica operacoes de escrita numa unica transacao.
 *
 * `somenteValidar` existe para o botao de conferir da tela: o Google valida
 * tudo (limite de caracteres do anuncio, orcamento minimo, politica de
 * conteudo) e nao grava nada. E a diferenca entre descobrir o problema antes ou
 * depois de uma campanha nascer quebrada.
 */
export async function mutar(opts: {
  userId: string;
  customerId: string;
  operacoes: OperacaoMutate[];
  somenteValidar?: boolean;
}): Promise<{ resultados: Array<Record<string, any>>; validado: boolean }> {
  const cid = soDigitos(opts.customerId);
  if (!cid) {
    throw new ErroGoogleAds("ID de conta invalido.", { status: 400, codigo: "conta_invalida" });
  }
  if (opts.operacoes.length === 0) {
    throw new ErroGoogleAds("Nenhuma operacao para enviar.", { status: 400, codigo: "sem_operacoes" });
  }

  const resposta = await requisitar<{ mutateOperationResponses?: Array<Record<string, any>> }>({
    userId: opts.userId,
    caminho: `/customers/${cid}/googleAds:mutate`,
    metodo: "POST",
    corpo: {
      mutateOperations: opts.operacoes,
      // partialFailure fica FALSE de proposito: criar orcamento, campanha,
      // grupo e anuncio sao passos de uma coisa so. Com falha parcial, um
      // anuncio recusado deixaria no ar uma campanha vazia consumindo verba.
      partialFailure: false,
      validateOnly: opts.somenteValidar === true,
      responseContentType: "RESOURCE_NAME_ONLY",
    },
  });

  return {
    resultados: resposta.mutateOperationResponses ?? [],
    validado: opts.somenteValidar === true,
  };
}
