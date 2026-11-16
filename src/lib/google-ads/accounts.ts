// Contas de anuncio visiveis para quem conectou.
//
// `customers:listAccessibleCustomers` devolve APENAS os IDs, sem nome. Uma tela
// que mostra "5299881234" em vez de "By Imperio Dog" obriga a responsavel a
// conferir no painel do Google antes de escolher -- e escolher a conta errada
// aqui significa gastar verba na conta de outra pessoa. Por isso cada ID passa
// por uma consulta de nome antes de chegar na interface.
//
// Com gerenciador (MCC) configurado, o nome de todas as filhas vem numa unica
// consulta a `customer_client`. Sem gerenciador, e uma consulta por conta --
// aceitavel porque a lista de contas acessiveis de um anunciante e curta, e
// limitada aqui de todo jeito.

import { consultar, requisitarComToken, type LinhaGaql } from "./client";
import { loginCustomerId, soDigitos } from "./config";

export type ContaAds = {
  id: string;
  nome: string;
  moeda: string | null;
  fusoHorario: string | null;
  gerenciador: boolean;
  contaDeTeste: boolean;
};

const MAX_CONTAS_SEM_MCC = 30;

function formatarId(id: string): string {
  // O painel do Google mostra 123-456-7890. Repetir esse formato na tela evita
  // que alguem compare numeros diferentes achando que sao contas diferentes.
  const d = soDigitos(id) ?? id;
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : d;
}

export function idFormatado(id: string): string {
  return formatarId(id);
}

function linhaParaConta(linha: LinhaGaql, prefixo: "customer" | "customerClient"): ContaAds | null {
  const bruto = linha[prefixo];
  if (!bruto) return null;
  const id = soDigitos(String(bruto.id ?? ""));
  if (!id) return null;
  return {
    id,
    nome: String(bruto.descriptiveName || "").trim() || `Conta ${formatarId(id)}`,
    moeda: bruto.currencyCode ? String(bruto.currencyCode) : null,
    fusoHorario: bruto.timeZone ? String(bruto.timeZone) : null,
    gerenciador: bruto.manager === true,
    contaDeTeste: bruto.testAccount === true,
  };
}

const CAMPOS_CLIENTE =
  "customer_client.id, customer_client.descriptive_name, customer_client.currency_code, " +
  "customer_client.time_zone, customer_client.manager, customer_client.test_account";

const CAMPOS_CONTA =
  "customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, " +
  "customer.manager, customer.test_account";

/** IDs de conta que o usuario autorizado consegue operar. */
export async function listarIdsAcessiveis(accessToken: string): Promise<string[]> {
  const resposta = await requisitarComToken<{ resourceNames?: string[] }>({
    accessToken,
    caminho: "/customers:listAccessibleCustomers",
  });
  return (resposta.resourceNames ?? [])
    .map((nome) => soDigitos(nome.split("/").pop() ?? ""))
    .filter((id): id is string => Boolean(id));
}

/**
 * Lista as contas com nome, usando apenas um access token. E o caminho que o
 * adapter OAuth percorre durante a conexao.
 */
export async function listarContasComToken(accessToken: string): Promise<ContaAds[]> {
  const mcc = loginCustomerId();

  if (mcc) {
    // customer_client enxerga a hierarquia inteira abaixo do gerenciador.
    // `level <= 2` cobre filhas diretas e netas sem trazer a arvore toda.
    const resposta = await requisitarComToken<{ results?: LinhaGaql[] }>({
      accessToken,
      caminho: `/customers/${mcc}/googleAds:search`,
      metodo: "POST",
      corpo: {
        query:
          `SELECT ${CAMPOS_CLIENTE} FROM customer_client ` +
          "WHERE customer_client.status = 'ENABLED' AND customer_client.level <= 2",
      },
    });
    const contas = (resposta.results ?? [])
      .map((linha) => linhaParaConta(linha, "customerClient"))
      .filter((c): c is ContaAds => c !== null);
    if (contas.length > 0) return contas.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    // Cai no caminho sem MCC: um gerenciador sem filhas habilitadas nao e
    // motivo para a tela aparecer vazia.
  }

  const ids = (await listarIdsAcessiveis(accessToken)).slice(0, MAX_CONTAS_SEM_MCC);
  const contas = await Promise.all(
    ids.map(async (id) => {
      try {
        const resposta = await requisitarComToken<{ results?: LinhaGaql[] }>({
          accessToken,
          caminho: `/customers/${id}/googleAds:search`,
          metodo: "POST",
          corpo: { query: `SELECT ${CAMPOS_CONTA} FROM customer` },
        });
        const linha = (resposta.results ?? [])[0];
        return linha ? linhaParaConta(linha, "customer") : null;
      } catch (erro) {
        // Uma conta sem permissao de leitura nao derruba a lista das outras.
        // Mas sem este aviso o erro vira "conta sem nome e sem moeda", que
        // parece dado faltando na conta e nao falha de consulta -- ja custou
        // tempo uma vez.
        console.warn(`[google-ads/contas] conta ${formatarId(id)} nao respondeu:`, erro);
        return {
          id,
          nome: `Conta ${formatarId(id)}`,
          moeda: null,
          fusoHorario: null,
          gerenciador: false,
          contaDeTeste: false,
        } satisfies ContaAds;
      }
    }),
  );

  return contas
    .filter((c): c is ContaAds => c !== null)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Dados de uma conta so, pelo admin ja conectado. */
export async function detalhesDaConta(userId: string, customerId: string): Promise<ContaAds | null> {
  const linhas = await consultar({
    userId,
    customerId,
    gaql: `SELECT ${CAMPOS_CONTA} FROM customer`,
    limitePaginas: 1,
  });
  const linha = linhas[0];
  return linha ? linhaParaConta(linha, "customer") : null;
}
