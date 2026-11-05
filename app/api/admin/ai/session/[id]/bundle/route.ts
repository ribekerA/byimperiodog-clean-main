import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { assembleSessionProduct } from "@/lib/aiPipeline";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(_req);
  if (auth) return auth;
  const bundle = await assembleSessionProduct((await ctx.params).id);
  if (!bundle) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, bundle });
}
