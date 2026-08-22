import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * Rota coringa que existe so para o 404 ter dono.
 *
 * O projeto nao tem app/layout.tsx — os dois layouts raiz sao os dos grupos,
 * (public) e (admin). Sem layout raiz o Next recusa um app/not-found.tsx no
 * topo ("not-found.tsx doesn't have a root layout"), entao a unica pagina de
 * erro que o site conseguia mostrar era a de dentro de (public), e ela so
 * alcanca URLs que o Next ja reconheceu como rota daquele grupo:
 * /filhotes/slug-que-nao-existe passava por la, /qualquer-coisa nao.
 *
 * O que sobrava para essas URLs era a tela interna do Next — fundo branco,
 * "404 | This page could not be found", em ingles, sem cabecalho, sem rodape
 * e sem nenhum link de volta. Boa parte delas vem de link antigo compartilhado
 * no WhatsApp e de pagina de filhote ja entregue.
 *
 * Esta rota captura o que ninguem mais capturou e chama notFound(), que
 * devolve o mesmo status 404 de antes e renderiza app/(public)/not-found.tsx,
 * agora com Header, Footer e caminhos de volta. Rotas especificas continuam
 * ganhando dela na resolucao do Next: o coringa e sempre a ultima opcao.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

export default function CatchAllNotFound() {
  notFound();
}
