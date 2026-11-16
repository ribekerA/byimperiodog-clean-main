// Entrada e saida compartilhadas das rotas de /api/admin/google-ads.
//
// Sobre devolver a mensagem do Google ao cliente: src/lib/apiErro.ts estabelece
// que texto de excecao nao vai para a resposta, porque foi assim que o nome de
// coluna do Postgres apareceu em producao. A excecao aqui e deliberada e
// limitada ao ErroGoogleAds: a classe nao carrega stack nem SQL, so a mensagem
// que a API do Google escreveu sobre a CONTA DE ANUNCIOS remota ("developer
// token em modo de teste", "conta sem acesso", "orcamento abaixo do minimo").
// Essa frase e a unica informacao que permite consertar a configuracao, quem
// chama e um admin autenticado com settings:write, e nada dela descreve este
// servidor. Qualquer outro erro continua passando por erroPublico.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireAdminContext } from "@/lib/adminAuth";
import { erroPublico } from "@/lib/apiErro";

import { ErroGoogleAds } from "./client";

export type ContextoRota =
  | { resposta: NextResponse; userId: null }
  | { resposta: null; userId: string };

/**
 * Exige admin com permissao de escrita de configuracao.
 *
 * O nome carrega `requireAdmin` de proposito. tests/unit/rotas-de-escrita.test.ts
 * procura no TEXTO de cada route.ts um identificador de guarda, porque um
 * wrapper com nome qualquer faz a rota parecer aberta na auditoria -- e foi
 * rota aberta passando despercebida que motivou aquele teste.
 */
export function requireAdminAds(req: NextRequest | Request): ContextoRota {
  const auth = requireAdminContext(req, "settings:write");
  if (auth.response) return { resposta: auth.response, userId: null };
  const userId = auth.context?.session?.userId;
  if (!userId) {
    return {
      resposta: NextResponse.json({ ok: false, error: "interactive-session-required" }, { status: 401 }),
      userId: null,
    };
  }
  return { resposta: null, userId };
}

type ErroComProblemas = Error & { problemas?: string[] };

/**
 * Converte qualquer falha das rotas do Ads em resposta.
 *
 * Tres caminhos:
 * - erro de validacao local (`problemas`): 400 com a lista em portugues, para a
 *   tela mostrar campo por campo;
 * - ErroGoogleAds: status e mensagem da propria API (ver cabecalho);
 * - o resto: erroPublico, com o detalhe ficando no log do servidor.
 */
export function responderErroAds(contexto: string, erro: unknown): NextResponse {
  const comProblemas = erro as ErroComProblemas;
  if (Array.isArray(comProblemas?.problemas) && comProblemas.problemas.length > 0) {
    return NextResponse.json(
      { ok: false, error: "dados_invalidos", problemas: comProblemas.problemas },
      { status: 400 },
    );
  }

  if ((erro as { name?: string })?.name === "confirmacao_necessaria" || (erro as Error)?.message === "confirmacao_necessaria") {
    const e = erro as Error & { tipo?: string; titulo?: string };
    return NextResponse.json(
      {
        ok: false,
        error: "confirmacao_necessaria",
        tipo: e.tipo ?? null,
        titulo: e.titulo ?? null,
        aviso: "Esta recomendacao aumenta o gasto da conta. Confirme para aplicar.",
      },
      { status: 409 },
    );
  }

  if (erro instanceof ErroGoogleAds) {
    return NextResponse.json(
      { ok: false, error: erro.codigo, mensagem: erro.message, detalhes: erro.detalhes },
      { status: erro.status >= 400 && erro.status < 600 ? erro.status : 502 },
    );
  }

  const conhecidos: Record<string, { status: number; mensagem: string }> = {
    sem_palavras_chave: { status: 400, mensagem: "Informe pelo menos uma palavra-chave." },
    lance_invalido: { status: 400, mensagem: "O lance precisa ser maior que zero." },
    orcamento_invalido: { status: 400, mensagem: "O orcamento precisa ser maior que zero." },
  };
  const conhecido = conhecidos[(erro as Error)?.message ?? ""];
  if (conhecido) {
    return NextResponse.json(
      { ok: false, error: (erro as Error).message, mensagem: conhecido.mensagem },
      { status: conhecido.status },
    );
  }

  return erroPublico(contexto, erro, 500, { code: "google_ads_falhou" });
}
