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

interface ReviewBody {
  puppySlug:    string;
  reviewerName: string;
  reviewerCity?: string;
  rating:        number;
  comment:       string;
  photoUrl?:     string;
}

export async function POST(req: NextRequest) {
  let body: ReviewBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { puppySlug, reviewerName, rating, comment, reviewerCity, photoUrl } = body;

  // Validação básica
  if (!puppySlug || !reviewerName || !rating || !comment) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating deve ser entre 1 e 5" }, { status: 400 });
  }
  if (comment.length < 10) {
    return NextResponse.json({ error: "Comentário muito curto (mínimo 10 caracteres)" }, { status: 400 });
  }
  if (reviewerName.length > 80) {
    return NextResponse.json({ error: "Nome muito longo" }, { status: 400 });
  }

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
