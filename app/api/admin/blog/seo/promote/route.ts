export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Promote a suggestion row to override and mark approved
export async function POST(req: Request) {
  try {
    const { suggestion_id, approved_by } = await req.json();
    if (!suggestion_id) return NextResponse.json({ error: "suggestion_id é obrigatório" }, { status: 400 });
    const sb = supabaseAdmin();

    const { data: s, error } = await sb
      .from("seo_suggestions")
      .select("id,entity_type,entity_id,entity_ref,data_json")
      .eq("id", suggestion_id)
      .maybeSingle();
    if (error) throw error;
    if (!s) return NextResponse.json({ error: "Sugestão não encontrada" }, { status: 404 });

    const { error: upErr } = await sb
      .from("seo_overrides")
      .upsert({ entity_type: s.entity_type, entity_id: s.entity_id, entity_ref: s.entity_ref, data_json: s.data_json }, { onConflict: "entity_type,entity_id,entity_ref" });
    if (upErr) throw upErr;

    await sb
      .from("seo_suggestions")
      .update({ status: "approved", approved_by: approved_by || null, approved_at: new Date().toISOString() })
      .eq("id", suggestion_id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
