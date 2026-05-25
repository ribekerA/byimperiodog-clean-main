export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function authed(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "1" || (req.headers.get("x-admin-pass") === process.env.ADMIN_PASS);
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const tz = searchParams.get("tz") || "America/Sao_Paulo";
  const days = parseInt(searchParams.get("days") || "14", 10);
  const source = searchParams.get("source");

  const { data, error } = await supabaseAdmin().rpc("kpi_counts_v2", { tz, days, source });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ kpi: data });
}
