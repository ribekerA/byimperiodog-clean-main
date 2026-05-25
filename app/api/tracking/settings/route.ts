export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { respondWithError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("api:tracking:settings");

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
      .from("tracking_settings")
      .select("facebook_pixel_id,ga_measurement_id,gtm_container_id,tiktok_pixel_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json(data || {}, { status: 200 });
  } catch (error) {
    logger.error("Falha ao obter tracking settings", { error: String(error) });
    return respondWithError(error);
  }
}
