export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { recalcPricingForPuppy } from "@/lib/ai/pricing-engine";

export async function GET(req: NextRequest) {
  const guard = requireAdminApi(req);
  if (guard) return guard;

  const puppyId = req.nextUrl.searchParams.get("id");
  if (!puppyId) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const result = await recalcPricingForPuppy(puppyId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
