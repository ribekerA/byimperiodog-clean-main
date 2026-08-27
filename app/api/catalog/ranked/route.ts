import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { getRankedPuppies } from "@/lib/ai/catalog-ranking";
import { erroPublico } from "@/lib/apiErro";

export const dynamic = "force-dynamic";

/**
 * Ranking comercial do catálogo — painel, não vitrine.
 *
 * A rota estava aberta. Uma rodada anterior já tinha cortado as colunas mais
 * graves da tabela `puppies` (custo, margem, anotação interna, id de cliente),
 * mas continuava devolvendo o join `catalog_ranking(score, flag, reason, …)`,
 * e `reason` é texto de gestão: "Demanda (7 leads)", "Estoque antigo",
 * "Reservado", "Premium". Um `curl` sem cookie nenhum lia quantos leads cada
 * filhote tinha recebido, quais estavam parados e quais estavam reservados.
 *
 * Duas regras do projeto proíbem isso ao mesmo tempo: dado de lead não sai em
 * saída pública, e status de filhote é informação interna — a vitrine não
 * publica estoque. Nenhuma página do site chamava este endpoint (a busca por
 * "catalog/ranked" em app/, src/, scripts/ e tests/ não encontra chamador), de
 * modo que fechá-lo atrás do guard de admin não tira nada do ar.
 */
export async function GET(request: Request) {
  const autorizacao = requireAdminApi(request);
  if (autorizacao) return autorizacao;

  const { searchParams } = new URL(request.url);
  const filters = {
    color: searchParams.get("color") || undefined,
    gender: searchParams.get("gender") || undefined,
    city: searchParams.get("city") || undefined,
    state: searchParams.get("state") || undefined,
    status: searchParams.get("status") || undefined,
  };

  try {
    const data = await getRankedPuppies(filters);
    return NextResponse.json({ data });
  } catch (e) {
    return erroPublico("api/catalog/ranked", e);
  }
}
