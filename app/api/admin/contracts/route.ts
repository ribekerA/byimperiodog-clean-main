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
      .select("id,code,status,signed_at,created_at,payload,hemograma_path,laudo_path,signature_path,total_price_cents,lead_id")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = requireAdminApi(req);
  if (guard) return guard;

  const {
    lead_id, total_price_cents,
    nome_filhote, cor, sexo, nascimento_filhote,
  } = await req.json().catch(() => ({}));

  try {
    const sb   = supabaseAdmin();
    const code = randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();

    // Payload inicial com dados do filhote preenchidos pelo admin
    const payload = {
      nome_filhote:       nome_filhote       ?? "",
      cor:                cor                ?? "",
      sexo:               sexo               ?? "",
      nascimento_filhote: nascimento_filhote ?? "",
    };

    const { data, error } = await sb
      .from("contracts")
      .insert({
        code,
        lead_id:           lead_id           ?? null,
        status:            "pendente",
        total_price_cents: total_price_cents ?? null,
        payload,
      } as Parameters<ReturnType<typeof sb.from>["insert"]>[0])
      .select("id,code")
      .single();

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br";
    const link    = `${baseUrl}/contract/${data.code}`;

    return NextResponse.json({ ok: true, code: data.code, link });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);

    // Instrução de migration caso puppy_id ainda seja NOT NULL no DB
    if (msg.includes("puppy_id") || msg.includes("violates not-null")) {
      return NextResponse.json({
        ok: false,
        error: "puppy_id_not_null",
        message: "Execute o SQL abaixo no Supabase SQL Editor para habilitar contratos sem filhote vinculado:",
        sql: "ALTER TABLE contracts ALTER COLUMN puppy_id DROP NOT NULL;",
      }, { status: 422 });
    }

    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
