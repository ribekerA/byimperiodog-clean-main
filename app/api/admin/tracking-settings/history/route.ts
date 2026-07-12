import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const env = req.nextUrl.searchParams.get("environment") || undefined;
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || "30"), 100);

  try {
    const sb = supabaseAdmin();
    let query = sb
      .from("tracking_audit_log")
      .select("id,environment,before,after,created_at,admin_id")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (env) query = query.eq("environment", env);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ history: data || [] });
  } catch {
    return NextResponse.json({ history: [] });
  }
}
