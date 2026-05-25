import { NextResponse } from "next/server";

import { assessLeadFraud } from "@/lib/ai/fraud-guard";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const leadId = body?.leadId as string | undefined;
  if (!leadId) return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 });

  const result = await assessLeadFraud(leadId);
  return NextResponse.json({ fraud: result });
}
