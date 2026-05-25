import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "5", 10) || 5, 1), 50);

    const s = supabaseAdmin();

    if (id) {
      // Retorna o registro completo de um filhote específico para inspeção detalhada
      const { data, error } = await s.from("puppies").select("*").eq("id", id).single();
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, record: data });
    }

    // Amostra recente com campos relevantes de mídia para comparação rápida
    const { data, error } = await s
      .from("puppies")
      .select("id, nome, name, status, created_at, cover_url, media, midia")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      count: data?.length ?? 0,
      ids: (data ?? []).map((r: { id: string }) => r.id),
      sample: data,
      note:
        "Use ?id=<uuid> para detalhar um registro específico; ?limit=N para ajustar a amostra (max 50). Campos: cover_url (capa), media (array de URLs normalizado), midia (legado).",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
