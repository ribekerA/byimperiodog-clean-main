export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { requireAdminApi } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const guard = requireAdminApi(req);
  if (guard) return guard;

  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("contracts")
      .select("id,code,status,signed_at,created_at,puppy_id,payload,hemograma_path,laudo_path,total_price_cents,lead_id")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // Busca nomes dos filhotes
    type Row = (typeof data)[number];
    const puppyIds = [...new Set((data ?? []).map((c: Row) => c.puppy_id).filter(Boolean))];
    const puppyMap = new Map<string, string>();
    if (puppyIds.length) {
      const { data: puppies } = await sb.from("puppies").select("id,name").in("id", puppyIds);
      (puppies ?? []).forEach((p: { id: string; name?: string | null }) => puppyMap.set(p.id, p.name ?? "Filhote"));
    }

    const items = (data ?? []).map((c: Row) => ({
      ...c,
      puppyName: puppyMap.get(c.puppy_id) ?? "Filhote",
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = requireAdminApi(req);
  if (guard) return guard;

  const { puppy_id, lead_id, total_price_cents } = await req.json().catch(() => ({}));
  if (!puppy_id) return NextResponse.json({ error: "puppy_id obrigatório" }, { status: 400 });

  try {
    const sb   = supabaseAdmin();
    const code = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();

    const { data, error } = await sb
      .from("contracts")
      .insert({
        code,
        puppy_id,
        lead_id:           lead_id ?? null,
        status:            "pendente",
        total_price_cents: total_price_cents ?? null,
      })
      .select("id,code")
      .single();

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br";
    const link    = `${baseUrl}/contract/${data.code}`;

    return NextResponse.json({ ok: true, code: data.code, link });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
