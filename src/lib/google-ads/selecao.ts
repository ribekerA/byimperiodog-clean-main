// Qual conta do Google Ads este admin esta gerenciando.
//
// Uma conexao OAuth da acesso a TODAS as contas que o login alcanca -- numa
// agencia, dezenas. A conta escolhida fica em integrations.metadata, e nao numa
// tabela nova, porque e um dado da conexao: perder a conexao e perder o
// sentido da escolha.
//
// O ID e conferido contra a lista de contas acessiveis antes de gravar. Sem
// isso, um ID digitado errado (ou mandado por engano pela tela) viraria uma
// sequencia de chamadas a uma conta de terceiro, cada uma respondendo erro de
// permissao -- e o diagnostico apareceria como "a integracao parou de
// funcionar".

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getIntegrationForUser } from "@/lib/tracking/integrations";

import { listarContasComToken } from "./accounts";
import { ErroGoogleAds, tokenDeAcesso } from "./client";
import { soDigitos } from "./config";

/** Conta gravada para este admin, ou null se ele ainda nao escolheu. */
export async function contaSelecionada(userId: string): Promise<string | null> {
  const integracao = await getIntegrationForUser("google_ads", userId);
  if (!integracao) return null;
  const bruto = (integracao.metadata as Record<string, unknown> | null)?.customerId;
  return soDigitos(typeof bruto === "string" ? bruto : null);
}

/**
 * Conta escolhida, ou erro pedindo que se escolha.
 *
 * Toda rota de leitura e de escrita passa por aqui: assim nenhuma chamada sai
 * com customerId vazio, que a API responde como 404 generico.
 */
export async function contaObrigatoria(userId: string): Promise<string> {
  const cid = await contaSelecionada(userId);
  if (!cid) {
    throw new ErroGoogleAds("Escolha a conta do Google Ads antes de continuar.", {
      status: 409,
      codigo: "conta_nao_escolhida",
    });
  }
  return cid;
}

/** Grava a conta escolhida, depois de confirmar que o login alcanca ela. */
export async function selecionarConta(opts: {
  userId: string;
  customerId: string;
}): Promise<{ customerId: string; nome: string }> {
  const cid = soDigitos(opts.customerId);
  if (!cid) {
    throw new ErroGoogleAds("ID de conta invalido.", { status: 400, codigo: "conta_invalida" });
  }

  const accessToken = await tokenDeAcesso(opts.userId);
  const contas = await listarContasComToken(accessToken);
  const escolhida = contas.find((c) => c.id === cid);
  if (!escolhida) {
    throw new ErroGoogleAds("Esta conta nao esta entre as que o login alcanca.", {
      status: 403,
      codigo: "conta_sem_acesso",
    });
  }
  if (escolhida.gerenciador) {
    // Conta gerenciadora (MCC) nao veicula anuncio: ela so administra outras.
    // Escolher uma aqui produziria telas vazias e erros de "operacao nao
    // permitida neste tipo de conta" em toda escrita.
    throw new ErroGoogleAds("Esta e uma conta gerenciadora; escolha uma conta de anuncios.", {
      status: 400,
      codigo: "conta_gerenciadora",
    });
  }

  // Grava so a coluna metadata: reescrever a linha inteira exigiria
  // recriptografar os tokens sem necessidade nenhuma.
  const integracao = await getIntegrationForUser("google_ads", opts.userId);
  if (!integracao) {
    throw new ErroGoogleAds("Conta do Google Ads nao conectada.", {
      status: 404,
      codigo: "nao_conectado",
    });
  }

  const metadata = {
    ...((integracao.metadata as Record<string, unknown> | null) ?? {}),
    customerId: cid,
    customerNome: escolhida.nome,
    customerMoeda: escolhida.moeda,
    customerContaDeTeste: escolhida.contaDeTeste,
  };

  const supa = supabaseAdmin();
  const { error } = await supa
    .from("integrations")
    .update({ metadata })
    .eq("user_id", opts.userId)
    .eq("provider", "google_ads");
  if (error) {
    throw new Error(`Falha ao gravar a conta escolhida: ${error.message}`);
  }

  return { customerId: cid, nome: escolhida.nome };
}
