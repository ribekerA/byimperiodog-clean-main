export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { respondWithError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("api:integrations:list");

function getAuthenticatedUserId(req: NextRequest): string | null {
  const adminAuth = req.cookies.get("admin_auth")?.value;
  if (!adminAuth) return null;
  const envUserId = (process.env.ADMIN_USER_ID || process.env.DEFAULT_ADMIN_USER_ID || "").trim();
  return envUserId || "admin";
}

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from("integrations")
      .select("provider,id,access_token")
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
      if (idx >= 0) providers[idx].connected = !!row.access_token;
    });
    return NextResponse.json(providers, { status: 200 });
  } catch (error) {
    logger.error("Falha ao listar integrações", { error: String(error) });
    return respondWithError(error);
  }
}
