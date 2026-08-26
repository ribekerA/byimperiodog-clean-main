// Resposta de erro para rotas de API.
//
// O problema que isto resolve: dezessete pontos de app/api devolviam
// `error.message` ou `String(e)` direto no corpo da resposta. Em erro de banco
// isso vira o texto do Postgres na tela de quem chamou -- nome de tabela, nome
// de coluna, texto da constraint. Foi assim que /api/diag/puppies respondeu
// `column puppies.cover_url does not exist` em producao: um mapa gratuito do
// schema para qualquer pessoa. Um caso ainda pior devolvia `error.stack`, com
// caminho de arquivo do servidor.
//
// A regra desta rodada: mensagem que o servidor escreveu (validacao, limite de
// taxa, autorizacao) pode ir para o cliente, porque foi redigida para ele.
// Mensagem que veio de excecao fica no log do servidor e vira texto generico na
// resposta.
import { NextResponse } from "next/server";

export const MENSAGEM_ERRO_PUBLICA = "Não foi possível concluir a solicitação.";

/** Registra o erro no log do servidor, onde ele continua util para depurar. */
export function registrarErro(contexto: string, erro: unknown): void {
  const detalhe =
    erro instanceof Error
      ? `${erro.name}: ${erro.message}`
      : typeof erro === "object" && erro !== null && "message" in erro
        ? String((erro as { message: unknown }).message)
        : String(erro);
  console.error(`[${contexto}]`, detalhe);
}

/**
 * Resposta de erro sanitizada. Loga o detalhe no servidor e devolve sempre a
 * mesma frase ao cliente.
 *
 * @param contexto identificador curto da rota, so para o log (ex.: "api/leads").
 * @param extra    campos adicionais seguros (ex.: `{ code: "insert_failed" }`).
 *                 Nunca passe nada derivado da excecao aqui.
 */
export function erroPublico(
  contexto: string,
  erro: unknown,
  status = 500,
  extra?: Record<string, unknown>,
): NextResponse {
  registrarErro(contexto, erro);
  return NextResponse.json({ ok: false, error: MENSAGEM_ERRO_PUBLICA, ...extra }, { status });
}
