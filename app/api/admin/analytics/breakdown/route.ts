export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supa = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

function authed(req: NextRequest) {
  return req.cookies.get("admin_auth")?.value === "1";
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const tz = searchParams.get("tz") || "America/Sao_Paulo";
  const days = parseInt(searchParams.get("days") || "14", 10);
  const by = (searchParams.get("by") || "source") as "source" | "campaign";
  const source = searchParams.get("source") || null;

  const fn = by === "source" ? "source_breakdown_v1" : "campaign_breakdown_v1";
  const args: any = by === "source" ? { tz, days } : { tz, days, source };

  const { data, error } = await supa().rpc(fn, args);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data });
}
