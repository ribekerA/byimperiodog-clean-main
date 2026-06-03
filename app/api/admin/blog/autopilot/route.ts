export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { applyAutopilotSeo, runAutopilotSeo } from "@/lib/ai/autopilot-seo";

export async function GET(req: NextRequest) {
  const guard = requireAdminApi(req);
  if (guard) return guard;
  try {
    const result = await runAutopilotSeo();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = requireAdminApi(req);
  if (guard) return guard;
  const body = await req.json().catch(() => ({}));
  if (body.action === "apply") {
    try {
      const result = await applyAutopilotSeo();
      return NextResponse.json({ ok: true, applied: result.generatedMeta.length });
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}
