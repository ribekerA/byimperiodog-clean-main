export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { LEAD_STATUS, toDbLeadStatus } from "@/domain/lead-status";
import { leadStatusPatch } from "@/lib/admin/leadAdmin";
import { requireAdmin } from "@/lib/adminAuth";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Troca o status de um lead.
 *
 * O banco so aceita cinco status. Antes a rota gravava o que viesse, e a tela
 * mandava "em_contato" e "fechado": o banco recusava e nada mudava.
 */
export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const body = (await req.json().catch(() => ({}))) as { id?: unknown; status?: unknown };
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "Informe o lead." }, { status: 400 });

  const status = typeof body.status === "string" ? toDbLeadStatus(body.status) : null;
  if (!status) {
    return NextResponse.json({ error: `Status inválido. Use um destes: ${LEAD_STATUS.join(", ")}.` }, { status: 400 });
  }

  // Sem credenciais o cliente responde "ok" sem gravar nada.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !hasServiceRoleKey()) {
    return NextResponse.json({ error: "O painel não está ligado ao banco de dados." }, { status: 503 });
  }

  const supabase = supabaseAdmin();
  const current = await supabase.from("leads").select("id,status,first_responded_at").eq("id", id).maybeSingle();
  if (current.error) {
    console.error("[admin/leads/status] falha ao ler o lead", { code: current.error.code, message: current.error.message });
    return NextResponse.json({ error: "Não foi possível ler o lead." }, { status: 500 });
  }
  if (!current.data) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

  const patch = leadStatusPatch(
    status,
    current.data as { first_responded_at?: string | null },
    new Date().toISOString(),
  );
  const { error } = await supabase.from("leads").update(patch).eq("id", id);
  if (error) {
    console.error("[admin/leads/status] falha ao gravar", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Não foi possível gravar o status." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, status, firstRespondedAt: patch.first_responded_at ?? null });
}
