export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { parseAdminPuppyStatus, statusPatch } from "@/lib/admin/puppyAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Troca o status de um filhote do estoque interno.
 *
 * Status desconhecido e recusado (400): o codigo antigo transformava qualquer
 * valor estranho em "disponivel". A data da venda ou da reserva e gravada
 * junto, e e ela que faz a venda aparecer no dashboard.
 */
export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const body = (await req.json().catch(() => ({}))) as { id?: unknown; status?: unknown };
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "Faltou dizer qual filhote." }, { status: 400 });

  const next = parseAdminPuppyStatus(body.status);
  if (!next) {
    return NextResponse.json(
      { error: "Status inválido. Use disponível, reservado, vendido ou indisponível." },
      { status: 400 },
    );
  }

  const sb = supabaseAdmin();
  const { data: current, error: readError } = await sb
    .from("puppies")
    .select("id,status,sold_at,reserved_at")
    .eq("id", id)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Filhote não encontrado." }, { status: 404 });

  const nowIso = new Date().toISOString();
  const update = { ...statusPatch(current, next, nowIso), updated_at: nowIso };
  const { data: updated, error } = await sb.from("puppies").update(update).eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Filhote não encontrado." }, { status: 404 });

  return NextResponse.json({ ok: true, status: next });
}
