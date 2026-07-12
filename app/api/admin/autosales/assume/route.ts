export const dynamic = "force-dynamic";
import { type NextRequest, NextResponse } from "next/server";

import { requireAdminApi, logAdminAction } from "@/lib/adminAuth";
import { markAutoSalesHuman } from "@/lib/ai/autoSalesEngine";

export async function POST(req: NextRequest) {
  const guard = requireAdminApi(req);
  if (guard) return guard;

  const { sequenceId } = (await req.json().catch(() => ({}))) as { sequenceId?: string };
  if (!sequenceId) return NextResponse.json({ ok: false, error: "sequenceId obrigatório" }, { status: 400 });

  try {
    await markAutoSalesHuman(sequenceId);
    await logAdminAction({ route: "/api/admin/autosales/assume", method: "POST", action: "assume_human", payload: { sequenceId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
