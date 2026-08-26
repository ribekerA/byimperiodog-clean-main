export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reviews?status=pending&limit=50
 *     → lista avaliações para moderação (admin)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const autorizacao = requireAdminApi(req);
  if (autorizacao) return autorizacao;

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const limit  = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "2000"), 2000);

  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("puppy_reviews")
      .select("id,puppy_slug,reviewer_name,reviewer_city,rating,comment,photo_url,status,created_at")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ reviews: data ?? [] });
  } catch (err: unknown) {
    console.error("[admin/reviews GET]", err);
    return NextResponse.json({ reviews: [], error: "Supabase indisponível" });
  }
}
