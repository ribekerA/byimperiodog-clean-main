export const dynamic = "force-dynamic";

/**
 * GET  /api/reviews?slug=spitz-alemao-anao-creme-femea
 *      → retorna avaliações aprovadas do filhote
 *
 * POST /api/reviews
 *      → submete nova avaliação (status = 'pending', aguarda moderação)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { rateLimitRequest, tooManyRequests } from "@/lib/rateLimitDurable";
import { RequestBodyError, readJsonWithLimit } from "@/lib/requestGuards";
import { supabaseAnon } from "@/lib/supabaseAnon";

// ─── GET — avaliações aprovadas ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug obrigatório" }, { status: 400 });
  }

  try {
    const sb = supabaseAnon();
    const { data, error } = await sb
      .from("puppy_reviews")
      .select("id,reviewer_name,reviewer_city,rating,comment,photo_url,created_at")
      .eq("puppy_slug", slug)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ reviews: data ?? [] });
  } catch (err: unknown) {
    console.error("[reviews GET]", err);
    return NextResponse.json({ reviews: [], error: "Supabase indisponível" });
  }
}

// ─── POST — submeter nova avaliação ──────────────────────────────────────────

const reviewSchema = z.object({
  puppySlug: z.string().trim().min(1).max(200),
  reviewerName: z.string().trim().min(1).max(80),
  reviewerCity: z.string().trim().max(120).optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2_000),
  photoUrl: z.string().trim().max(2_048).optional(),
}).strict();

export async function POST(req: NextRequest) {
  const rate = await rateLimitRequest(req, { scope: "reviews", limit: 5, windowMs: 10 * 60_000 });
  if (!rate.allowed) return tooManyRequests(rate);

  let body: unknown;
  try {
    body = await readJsonWithLimit(req, 16 * 1024);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }
  const { puppySlug, reviewerName, rating, comment, reviewerCity, photoUrl } = parsed.data;

  try {
    const sb = supabaseAnon();
    const { error } = await sb.from("puppy_reviews").insert({
      puppy_slug:    puppySlug,
      reviewer_name: reviewerName.trim(),
      reviewer_city: reviewerCity?.trim() || null,
      rating:        Math.round(rating),
      comment:       comment.trim(),
      photo_url:     photoUrl?.trim() || null,
      status:        "pending",
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[reviews POST]", err);
    return NextResponse.json(
      { error: "Não foi possível salvar. Tente novamente." },
      { status: 500 }
    );
  }
}
