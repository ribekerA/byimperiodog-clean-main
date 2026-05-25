import { NextResponse } from "next/server";

import { generateDeepInsights } from "@/lib/ai/deep-insights";

export async function GET() {
  const report = await generateDeepInsights();
  return NextResponse.json(report);
}
