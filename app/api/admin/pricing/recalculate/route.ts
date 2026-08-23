import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { recalcPricingBulk, recalcPricingForPuppy } from "@/lib/ai/pricing-engine";

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const { puppyId } = await req.json().catch(() => ({}));
  try {
    if (puppyId) {
      const result = await recalcPricingForPuppy(puppyId);
      return NextResponse.json({ ok: true, result });
    }
    const result = await recalcPricingBulk();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
