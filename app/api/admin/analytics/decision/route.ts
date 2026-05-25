import { NextResponse } from "next/server";

import { generateDecisions, logDecisions } from "@/lib/ai/decision-engine";

export async function GET() {
  const decisions = await generateDecisions();
  return NextResponse.json({ decisions });
}

export async function POST() {
  const decisions = await generateDecisions();
  await logDecisions(decisions);
  return NextResponse.json({ decisions, logged: true });
}
