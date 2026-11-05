export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdminContext } from "@/lib/adminAuth";
import { respondWithError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("api:tracking:settings");

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminContext(req, "settings:write");
    if (auth.response) return auth.response;
    const userId = auth.context!.session!.userId;
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
