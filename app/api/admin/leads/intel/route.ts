export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { processLeadIntel } from "@/lib/leadIntel";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");
  if (!leadId) return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data, error } = await sb.from("lead_ai_insights").select("*").eq("lead_id", leadId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, insight: data });
}

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const { leadId, force } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 });

  try {
    const result = await processLeadIntel(leadId, Boolean(force));
    return NextResponse.json({ ok: true, insight: result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
