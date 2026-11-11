export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reviews?filter=pending|approved
 *     → avaliações para moderação, com a contagem das duas abas.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { listReviews, parseReviewFilter, type ReviewsClient } from "@/lib/admin/reviewsAdmin";
import { requireAdminApi } from "@/lib/adminAuth";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const autorizacao = requireAdminApi(req);
  if (autorizacao) return autorizacao;

  // Sem a chave do banco o cliente devolve lista vazia calado: isso nao e "nenhuma avaliacao".
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !hasServiceRoleKey()) {
    return NextResponse.json({ ok: false, error: "O banco não está configurado neste ambiente" }, { status: 503 });
  }

  const filter = parseReviewFilter(req.nextUrl.searchParams.get("filter"));

  try {
    const { items, counts } = await listReviews(supabaseAdmin() as unknown as ReviewsClient, filter);
    return NextResponse.json({ ok: true, filter, items, counts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin/reviews] falha ao listar", { code: (error as { code?: string } | null)?.code ?? "erro" });
    return NextResponse.json({ ok: false, error: "Não foi possível carregar as avaliações" }, { status: 500 });
  }
}
