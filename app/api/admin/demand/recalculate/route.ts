import { NextResponse } from "next/server";

import { recalcDemandPredictions } from "@/lib/ai/demand-prediction";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;
  try {
    const result = await recalcDemandPredictions();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
