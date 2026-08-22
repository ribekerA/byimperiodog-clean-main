export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi(req, { permission: "dashboard:read" });
  if (guard) return guard;
  const { searchParams } = new URL(req.url);
  const tz = searchParams.get("tz") || "America/Sao_Paulo";
  const days = parseInt(searchParams.get("days") || "14", 10);

  const { data, error } = await supabaseAdmin().rpc("distinct_sources", { tz, days });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sources: (data || []).map((r: any) => r.source) });
}
