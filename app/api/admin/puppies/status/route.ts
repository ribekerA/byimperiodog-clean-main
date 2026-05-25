export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function mapStatus(status?: string | null) {
  const value = (status || "disponivel").toLowerCase();
  if (value === "sold" || value === "vendido") return "vendido";
  if (value === "reserved" || value === "reservado") return "reservado";
  if (value === "indisponivel" || value === "unavailable" || value === "pending") return "indisponivel";
  return "disponivel";
}

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!id || !status) return NextResponse.json({ error: "id e status obrigatórios" }, { status: 400 });

  const update = { status: mapStatus(status), updated_at: new Date().toISOString() };
  const { error } = await supabaseAdmin().from("puppies").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
