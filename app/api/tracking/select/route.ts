export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminContext } from "@/lib/adminAuth";
import { erroPublico } from "@/lib/apiErro";
import { corpoJson } from "@/lib/limitePublico";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ProviderKey } from "@/lib/tracking/providers/types";
import { listResourcesByProvider } from "@/lib/tracking/resources";

const bodySchema = z.object({
  provider: z.enum(["facebook", "google_analytics", "google_tag_manager", "tiktok"]),
  resourceId: z.string().trim().min(1).max(300),
}).strict();

const FIELD_MAP: Record<ProviderKey, { idField: string; flagField: string }> = {
  facebook: { idField: "facebook_pixel_id", flagField: "is_facebook_pixel_enabled" },
  google_analytics: { idField: "ga_measurement_id", flagField: "is_ga_enabled" },
  google_tag_manager: { idField: "gtm_container_id", flagField: "is_gtm_enabled" },
  tiktok: { idField: "tiktok_pixel_id", flagField: "is_tiktok_enabled" },
};

export async function POST(req: NextRequest) {
  const auth = await requireAdminContext(req, "settings:write");
  if (auth.response) return auth.response;

  const lido = await corpoJson<unknown>(req, 4 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = bodySchema.safeParse(lido.dados);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const body: { provider: ProviderKey; resourceId: string } = parsed.data;
  const map = FIELD_MAP[body.provider];
  if (!map) {
    return NextResponse.json({ error: "unsupported_provider" }, { status: 400 });
  }
  const userId = auth.context!.session!.userId;

  try {
    const resources = await listResourcesByProvider(body.provider, userId);
    const exists = resources.some((r) => r.id === body.resourceId);
    if (!exists) {
      return NextResponse.json({ error: "resource_not_found" }, { status: 400 });
    }

    const payload: Record<string, any> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    payload[map.idField] = body.resourceId;
    payload[map.flagField] = true;

    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from("tracking_settings")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ settings: data });
  } catch (error: any) {
    return erroPublico("api/tracking/select", error, 500, { code: "save_failed" });
  }
}
