import { NextResponse } from "next/server";

import { runCrossMatch } from "@/lib/ai/crossmatch";
import { requireAdminApi } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const guard = await requireAdminApi(request, { permission: "cadastros:read" });
  if (guard) return guard;

  const body = await request.json().catch(() => ({}));
  const leadId = body?.leadId as string | undefined;
  if (!leadId) {
    return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 });
  }

  const suggestion = await runCrossMatch(leadId);
  return NextResponse.json({ suggestion });
}
