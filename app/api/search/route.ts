import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buscarConteudo } from "@/lib/search";

export const revalidate = 0;

/**
 * GET /api/search?q=termo&limit=10&offset=0&tag=slugTag
 *
 * Casca fina sobre src/lib/search.ts. A logica saiu daqui porque a pagina
 * /search precisava da mesma busca e estava indo busca-la nesta rota por HTTP,
 * com uma variavel de ambiente que nunca existiu — ver o cabecalho da lib.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rawQ = (url.searchParams.get("q") || "").trim();
  const started = Date.now();

  const { results, total } = await buscarConteudo(rawQ, {
    limit: Number(url.searchParams.get("limit") || "10"),
    offset: Number(url.searchParams.get("offset") || "0"),
    tag: url.searchParams.get("tag") || "",
  });

  return NextResponse.json(
    { results, count: results.length, total, q: rawQ, took_ms: Date.now() - started },
    { headers: { "Cache-Control": "no-store" } }
  );
}
