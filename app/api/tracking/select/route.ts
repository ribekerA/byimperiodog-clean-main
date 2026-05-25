export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ProviderKey } from "@/lib/tracking/providers/types";
import { listResourcesByProvider } from "@/lib/tracking/resources";

type Body = {
  provider: ProviderKey;
  resourceId: string;
};

const FIELD_MAP: Record<ProviderKey, { idField: string; flagField: string }> = {
  facebook: { idField: "facebook_pixel_id", flagField: "is_facebook_pixel_enabled" },
  google_analytics: { idField: "ga_measurement_id", flagField: "is_ga_enabled" },
  google_tag_manager: { idField: "gtm_container_id", flagField: "is_gtm_enabled" },
  tiktok: { idField: "tiktok_pixel_id", flagField: "is_tiktok_enabled" },
};

const DEFAULT_USER_ID = process.env.INTEGRATIONS_DEFAULT_USER_ID;

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const body = (await req.json()) as Body;
  const map = FIELD_MAP[body.provider];
  if (!map) {
    return NextResponse.json({ error: "unsupported_provider" }, { status: 400 });
  }
  const userId = DEFAULT_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: "missing_user" }, { status: 400 });
  }

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
    return NextResponse.json({ error: error?.message || "save_failed" }, { status: 500 });
  }
}
