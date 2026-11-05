export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdminContext } from "@/lib/adminAuth";
import { respondWithError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("api:integrations:list");

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminContext(req, "settings:write");
    if (auth.response) return auth.response;
    const userId = auth.context!.session!.userId;
    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from("integrations")
      .select("provider,id")
      .eq("user_id", userId);
    if (error) throw error;
    const providers: Array<{ provider: string; connected: boolean }> = [
      { provider: "facebook", connected: false },
      { provider: "google_analytics", connected: false },
      { provider: "google_tag_manager", connected: false },
      { provider: "tiktok", connected: false },
    ];
    (data || []).forEach((row: any) => {
      const idx = providers.findIndex((p) => p.provider === row.provider);
      if (idx >= 0) providers[idx].connected = true;
    });
    return NextResponse.json(providers, { status: 200 });
  } catch (error) {
    logger.error("Falha ao listar integrações", { error: String(error) });
    return respondWithError(error);
  }
}
