import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { generateDeepInsights } from "@/lib/ai/deep-insights";

export async function GET(req: Request) {
  const autorizacao = requireAdminApi(req);
  if (autorizacao) return autorizacao;

  const report = await generateDeepInsights();
  return NextResponse.json(report);
}
