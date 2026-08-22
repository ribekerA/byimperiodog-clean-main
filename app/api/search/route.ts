import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { rateLimitRequestMemory, tooManyRequests } from "@/lib/rateLimitDurable";
import { buscarConteudo } from "@/lib/search";

export const revalidate = 0;

const querySchema = z.object({
  q: z.string().trim().max(200),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).max(1_000).default(0),
  tag: z.string().trim().max(100).default(""),
});

/**
 * GET /api/search?q=termo&limit=10&offset=0&tag=slugTag
 *
 * Casca fina sobre src/lib/search.ts. A logica saiu daqui porque a pagina
 * /search precisava da mesma busca e estava indo busca-la nesta rota por HTTP,
 * com uma variavel de ambiente que nunca existiu — ver o cabecalho da lib.
 */
export async function GET(req: NextRequest) {
  const rate = rateLimitRequestMemory(req, { scope: "search", limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return tooManyRequests(rate);

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
    tag: url.searchParams.get("tag") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros de busca inválidos" }, { status: 400 });
  }
  const { q: rawQ, limit, offset, tag } = parsed.data;
  const started = Date.now();

  const { results, total } = await buscarConteudo(rawQ, {
    limit,
    offset,
    tag,
  });

  return NextResponse.json(
    { results, count: results.length, total, q: rawQ, took_ms: Date.now() - started },
    { headers: { "Cache-Control": "no-store" } }
  );
}
