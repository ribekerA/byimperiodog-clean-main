export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { recalcCatalogRanking } from "@/lib/ai/catalog-ranking";
import { requireAdminApi } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const guard = await requireAdminApi(req, { permission: "cadastros:write" });
  if (guard) return guard;

  try {
    const summary = await recalcCatalogRanking();
    await supabaseAdmin()
      .from("admin_actions")
      .insert({ action: "catalog_ranking_recalc", details: summary, created_at: new Date().toISOString() })
      .catch(() => null);
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
