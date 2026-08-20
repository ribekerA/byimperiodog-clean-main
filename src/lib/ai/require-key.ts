import { NextResponse } from "next/server";

/**
 * Falha explicita quando OPENAI_API_KEY nao existe.
 *
 * Por que existe
 * -------------
 * As rotas de IA do admin tinham, cada uma, um fallback proprio para o caso de
 * a chave estar ausente: montavam um MDX deterministico com frases como
 * "Conteudo placeholder offline para X" ou "Paragrafo de aprofundamento (1)
 * sobre X" e devolviam isso como se fosse artigo. O texto passava dos 800
 * caracteres, entrava na tabela com status `draft` e bastava um clique em
 * publicar para virar pagina indexavel.
 *
 * O resultado pratico era o pior possivel: a tela do admin dizia "gerado com
 * sucesso" quando nada tinha sido gerado. Erro na tela e recuperavel; texto de
 * enchimento publicado sob o nome do canil, nao — o Google le como conteudo
 * raso, e quem chega no artigo pela busca le uma frase que nao responde nada.
 *
 * Entao a chave passou a ser requisito, e nao preferencia. Sem ela a rota
 * responde 503 e o admin sabe exatamente o que fazer.
 */
export const ERRO_SEM_CHAVE_IA = "openai-key-ausente";

export function respostaSemChaveIA() {
  return NextResponse.json(
    {
      ok: false,
      error: ERRO_SEM_CHAVE_IA,
      message:
        "OPENAI_API_KEY nao esta configurada neste ambiente. A geracao por IA fica " +
        "indisponivel ate a variavel ser definida — nenhum texto automatico e " +
        "gravado no lugar.",
    },
    { status: 503 }
  );
}

/** Devolve a chave, ou `null` quando a rota deve responder 503. */
export function chaveIA(): string | null {
  const chave = process.env.OPENAI_API_KEY?.trim();
  return chave ? chave : null;
}
