export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const slugsParam = searchParams.get("slugs");
  if (!slugsParam) return NextResponse.json({ counts: {} });
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length === 0) return NextResponse.json({ counts: {} });

  return fetchAndCountLeads(slugs);
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const body = await req.json().catch(() => ({}));
  const slugs = Array.isArray(body.slugs)
    ? body.slugs.filter((s: any) => typeof s === 'string' && s.trim())
    : [];
  
  if (slugs.length === 0) return NextResponse.json({ counts: {} });

  return fetchAndCountLeads(slugs);
}

async function fetchAndCountLeads(slugs: string[]) {

  // Busca todas as linhas e agrega no app (tabela costuma ser pequena / uso admin)
  const { data, error } = await supabaseAdmin()
    .from("leads")
    .select("page_slug")
    .in("page_slug", slugs);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts = Object.fromEntries(slugs.map((s) => [s, 0]));
  for (const row of data || []) {
    if (row.page_slug && counts[row.page_slug] !== undefined) counts[row.page_slug]++;
  }

  return NextResponse.json({ counts });
}
