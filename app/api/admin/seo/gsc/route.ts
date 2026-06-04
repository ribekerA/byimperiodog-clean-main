export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { fetchGscData, isGscConfigured } from "@/lib/gsc";

export async function GET(req: NextRequest) {
  const guard = requireAdminApi(req);
  if (guard) return guard;

  if (!isGscConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "GSC_NOT_CONFIGURED",
      message: "Configure GOOGLE_SERVICE_ACCOUNT_KEY e GOOGLE_SEARCH_CONSOLE_SITE_URL nas variáveis de ambiente.",
    });
  }

  const days = Number(req.nextUrl.searchParams.get("days") ?? "28");
  const safeDays = [7, 14, 28, 90].includes(days) ? days : 28;

  try {
    const data = await fetchGscData(safeDays);
    return NextResponse.json({ ok: true, ...data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
