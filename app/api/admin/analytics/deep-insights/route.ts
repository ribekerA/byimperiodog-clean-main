import { NextResponse } from "next/server";

import { generateDeepInsights } from "@/lib/ai/deep-insights";
import { requireAdminApi } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const guard = await requireAdminApi(req, { permission: "dashboard:read" });
  if (guard) return guard;

  const report = await generateDeepInsights();
  return NextResponse.json(report);
}
