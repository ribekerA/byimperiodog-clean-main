import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("seo_history")
      .select("after,created_at")
      .eq("action", "audit")
      .order("created_at", { ascending: false })
      .limit(30);

    const history = ((data || []) as Array<{ after: Record<string, unknown> | null; created_at: string }>)
      .map((row) => ({
        score: (row.after?.score as number) ?? 0,
        errors: (row.after?.errors as number) ?? 0,
        warnings: (row.after?.warnings as number) ?? 0,
        indexed: (row.after?.indexed as number) ?? 0,
        date: row.created_at,
      }))
      .reverse();

    return NextResponse.json({ history });
  } catch {
    return NextResponse.json({ history: [] });
  }
}
