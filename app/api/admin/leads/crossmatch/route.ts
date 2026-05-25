import { NextResponse } from "next/server";

import { runCrossMatch } from "@/lib/ai/crossmatch";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const leadId = body?.leadId as string | undefined;
  if (!leadId) {
    return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 });
  }

  const suggestion = await runCrossMatch(leadId);
  return NextResponse.json({ suggestion });
}
