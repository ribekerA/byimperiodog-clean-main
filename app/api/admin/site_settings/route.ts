export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

function supabaseSafe() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Durante build/prerender sem secrets: devolve stub leve que evita throw.
    return {
      from: () => ({
        select: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null })
      })
    } as any;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

const ALLOWED = [
  "gtm_id","ga4_id","meta_pixel_id","tiktok_pixel_id","google_ads_id","google_ads_label",
  "pinterest_tag_id","hotjar_id","clarity_id","meta_domain_verify","fb_capi_token","tiktok_api_token"
] as const;

type Body = Partial<Record<typeof ALLOWED[number], string | null>>;

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Evita falha de prerender no build. Status 200 com placeholder.
    return NextResponse.json({ settings: null, note: 'site_settings stub (env ausente)' });
  }
  const { data, error } = await supabaseSafe().from("site_settings").select("*").eq("id", 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const body = (await req.json()) as Body;
  const patch: any = {};
  for (const k of ALLOWED) if (k in body) patch[k] = (body as any)[k];
  patch.updated_at = new Date().toISOString();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase env ausente (PUT bloqueado)' }, { status: 503 });
  }
  const { data, error } = await supabaseSafe().from("site_settings").update(patch).eq("id", 1).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}
