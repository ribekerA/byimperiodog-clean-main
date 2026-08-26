import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { generateDecisions, logDecisions } from "@/lib/ai/decision-engine";

export async function GET(req: Request) {
  const autorizacao = requireAdminApi(req);
  if (autorizacao) return autorizacao;

  const decisions = await generateDecisions();
  return NextResponse.json({ decisions });
}

export async function POST(req: Request) {
  const autorizacao = requireAdminApi(req);
  if (autorizacao) return autorizacao;

  const decisions = await generateDecisions();
  await logDecisions(decisions);
  return NextResponse.json({ decisions, logged: true });
}
