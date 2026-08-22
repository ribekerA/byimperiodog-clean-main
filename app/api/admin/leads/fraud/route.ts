import { NextResponse } from "next/server";

import { assessLeadFraud } from "@/lib/ai/fraud-guard";
import { requireAdminApi } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const guard = await requireAdminApi(request, { permission: "cadastros:read" });
  if (guard) return guard;

  const body = await request.json().catch(() => ({}));
  const leadId = body?.leadId as string | undefined;
  if (!leadId) return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 });

  const result = await assessLeadFraud(leadId);
  return NextResponse.json({ fraud: result });
}
