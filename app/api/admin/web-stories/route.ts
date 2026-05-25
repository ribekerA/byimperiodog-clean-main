export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data: stories, error } = await supabase
      .from("web_stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ stories: stories || [] });
  } catch (error) {
    console.error("Error fetching web stories:", error);
    return NextResponse.json(
      { error: "Falha ao buscar Web Stories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin();
    const body = await request.json();

    const { title, slug, publisher, poster_url, logo_url, status, pages } = body;

    if (!title || !slug || !publisher || !poster_url || !logo_url) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Verifica se o slug já existe
    const { data: existing } = await supabase
      .from("web_stories")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma Web Story com este slug" },
        { status: 409 }
      );
    }

    const { data: story, error } = await supabase
      .from("web_stories")
      .insert({
        title,
        slug,
        publisher,
        poster_url,
        logo_url,
        status: status || "draft",
        pages: pages || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    console.error("Error creating web story:", error);
    return NextResponse.json(
      { error: "Falha ao criar Web Story" },
      { status: 500 }
    );
  }
}
