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

import { getPuppyBySlug } from "@/lib/catalog-utils";
import { corpoJson, limiteDeTaxa } from "@/lib/limitePublico";
import { supabaseAnon } from "@/lib/supabaseAnon";

// ─── GET — avaliações aprovadas ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug || slug.length > 120 || !getPuppyBySlug(slug)) {
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
  puppySlug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/),
  reviewerName: z.string().trim().min(2).max(80),
  reviewerCity: z.string().trim().max(80).optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(600),
}).strict();

export async function POST(req: NextRequest) {
  // Avaliação é escrita pública anônima: sem teto, um script gravaria
  // milhares de linhas pendentes na fila de moderação do canil.
  const bloqueio = await limiteDeTaxa(req, "reviews", 5);
  if (bloqueio) return bloqueio;

  const lido = await corpoJson<unknown>(req);
  if (lido.resposta) return lido.resposta;
  const parsed = reviewSchema.safeParse(lido.dados);
  if (!parsed.success || !getPuppyBySlug(parsed.data?.puppySlug ?? "")) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { puppySlug, reviewerName, rating, comment, reviewerCity } = parsed.data;

  try {
    const sb = supabaseAnon();
    const { error } = await sb.from("puppy_reviews").insert({
      puppy_slug:    puppySlug,
      reviewer_name: reviewerName.trim(),
      reviewer_city: reviewerCity?.trim() || null,
      rating,
      comment,
      photo_url:     null,
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
