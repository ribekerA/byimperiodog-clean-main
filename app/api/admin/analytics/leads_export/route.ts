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
  const days = parseInt(searchParams.get("days") || "14", 10);

  const fromTs = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString();
  const { data: leads, error } = await supa()
    .from("leads")
    .select("id,created_at,first_name,last_name,phone,source,utm_source,utm_campaign,first_responded_at")
    .gte("created_at", fromTs)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = ["id","created_at","first_name","last_name","phone","source","utm_source","utm_campaign","first_responded_at"];
  const csv = [header.join(",")]
    .concat((leads||[]).map(r => header.map(h => JSON.stringify((r as any)[h] ?? "")).join(","))).join("\n");

  return new NextResponse(csv, {
    headers: { "Content-Type":"text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads_${days}d.csv"` }
  });
}
