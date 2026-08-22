import { NextResponse } from "next/server";

import { generateDecisions, logDecisions } from "@/lib/ai/decision-engine";
import { requireAdminApi } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const guard = await requireAdminApi(req, { permission: "dashboard:read" });
  if (guard) return guard;

  const decisions = await generateDecisions();
  return NextResponse.json({ decisions });
}

export async function POST(req: Request) {
  const guard = await requireAdminApi(req, { permission: "cadastros:write" });
  if (guard) return guard;

  const decisions = await generateDecisions();
  await logDecisions(decisions);
  return NextResponse.json({ decisions, logged: true });
}
