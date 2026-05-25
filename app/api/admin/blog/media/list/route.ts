import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic"; // evitar cache

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const role = (url.searchParams.get("role") || "").trim();
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("perPage") || "24", 10)));
    const tag = (url.searchParams.get("tag") || "").trim();
    const sb = supabaseAdmin();

    // Base query
  interface MediaRow { id: string; file_path: string; alt: string | null; caption: string | null; tags: string[] | null; created_at: string }
  let query = sb.from("media_assets").select("id,file_path,alt,caption,tags,created_at", { count: "exact" }).order("created_at", { ascending: false });
    if (q) query = query.or(`alt.ilike.%${q}%,caption.ilike.%${q}%`);
    if (tag) query = query.contains("tags", [tag]);

    const from = (page - 1) * perPage;
    const to = page * perPage - 1;
    query = query.range(from, to);
    const { data, error, count } = await query as { data: MediaRow[] | null; error: { message: string } | null; count: number | null };
    if (error) throw error;

    // Se filtrou por role, precisamos join com pivot
    let items: MediaRow[] = data || [];
    if (role) {
      interface PivotRow { media_id: string; role: string; post_id: string }
      const { data: piv } = await sb.from("post_media").select("media_id,role,post_id").eq("role", role).limit(5000);
      const allowed = new Set((piv || []).map((r: PivotRow) => r.media_id));
      items = items.filter((it: MediaRow) => allowed.has(it.id));
    }
    return NextResponse.json({ items, page, perPage, total: count || items.length });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
