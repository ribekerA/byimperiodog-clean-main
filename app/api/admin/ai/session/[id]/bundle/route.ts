import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { assembleSessionProduct, recomputeSessionProgress } from "@/lib/aiPipeline";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const auth = requireAdmin(_req);
  if (auth) return auth;
  await recomputeSessionProgress(ctx.params.id);
  const bundle = await assembleSessionProduct(ctx.params.id);
  if (!bundle) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, bundle });
}
