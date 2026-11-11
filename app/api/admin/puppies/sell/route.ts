export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { statusPatch } from "@/lib/admin/puppyAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Marca um filhote como vendido.
 *
 * So troca o status e grava a data da venda. O contrato nao e criado aqui: a
 * versao antiga tentava inserir um contrato com colunas que nao existem
 * (client_name, client_phone, client_email) e escondia a falha, alem de
 * responder "ok" mesmo quando a troca de status dava erro. Contrato se cria
 * na tela de Contratos.
 */
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const body = (await req.json().catch(() => ({}))) as { puppy_id?: unknown };
  const id = typeof body.puppy_id === "string" ? body.puppy_id.trim() : "";
  if (!id) return NextResponse.json({ error: "Faltou dizer qual filhote." }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: current, error: readError } = await sb
    .from("puppies")
    .select("id,sold_at,reserved_at")
    .eq("id", id)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Filhote não encontrado." }, { status: 404 });

  const nowIso = new Date().toISOString();
  const { data, error } = await sb
    .from("puppies")
    .update({ ...statusPatch(current, "sold", nowIso), updated_at: nowIso })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Filhote não encontrado." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
