export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/tracking/providers/registry";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getQuery(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const providerKey = (params?.provider || "").trim();
  const adapter = getProvider(providerKey);
  if (!adapter) {
    return NextResponse.json({ ok: false, error: "unsupported_provider" }, { status: 400 });
  }

  const qs = getQuery(req.url);
  const code = qs.get("code") || "";
  const state = qs.get("state") || "";
  if (!code) {
    return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
  }
  // TODO: validate state (nonce) from session/cookie if stored during login.
  if (!state) {
    // proceed but warn; in production enforce strict state validation
    console.warn("[oauth-callback] missing state for provider", providerKey);
  }

  try {
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/integrations/${providerKey}/callback`;
    const tokens = await adapter.exchangeCode({ code, redirectUri });

    const supa = supabaseAdmin();
    // Resolve current user; if using Supabase auth via cookies/JWT, augment here.
    // For now, allow service role upsert with placeholder user resolution.
    const userId = (process.env.TEST_USER_ID || process.env.ADMIN_USER_ID || "").trim();
    if (!userId) {
      // If no explicit user id, we cannot persist per-user.
      // You may replace this with request-auth extraction.
      console.warn("[oauth-callback] missing userId; set TEST_USER_ID or implement auth extraction");
    }

    // Persist/Upsert integration by (user_id, provider)
    const payload = {
      user_id: userId || null,
      provider: adapter.id,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken ?? null,
      expires_at: tokens.expiresAt ? new Date(tokens.expiresAt * 1000).toISOString() : null,
      provider_account_id: null,
      metadata: {},
    } as any;

    // If tokens include id info via future adapter, set provider_account_id
    if ((tokens as any).accountId) {
      payload.provider_account_id = (tokens as any).accountId;
    }

    const { error } = await supa
      .from("integrations")
      .upsert(payload, { onConflict: "user_id,provider" });
    if (error) {
      console.warn("[oauth-callback] upsert error", error);
    }

    // Auto-fetch and auto-configure first resource
    try {
      const resourcesAdapter = getProvider(providerKey);
      if (resourcesAdapter?.listResources) {
        const resources = await resourcesAdapter.listResources(tokens);
        if (resources && resources.length > 0) {
          const picked = resources[0];
          // Auto-save the first resource to tracking_settings (per-user) e pixels_settings (global)
          const patch: Record<string, string> = {};
          let pixelsField: keyof PixelEnv | null = null;
          switch (providerKey) {
            case "facebook":
              patch["facebook_pixel_id"] = picked.id;
              pixelsField = "metaPixelId";
              break;
            case "google_analytics":
              patch["ga_measurement_id"] = picked.id;
              pixelsField = "ga4Id";
              break;
            case "google_tag_manager":
              patch["gtm_container_id"] = picked.id;
              pixelsField = "gtmId";
              break;
            case "tiktok":
              patch["tiktok_pixel_id"] = picked.id;
              pixelsField = "tiktokPixelId";
              break;
          }

          if (Object.keys(patch).length > 0) {
            await supa.from("tracking_settings").upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
          }

          if (pixelsField) {
            const defaultEnv: PixelEnv = {
              gtmId: null,
              ga4Id: null,
              metaPixelId: null,
              tiktokPixelId: null,
              googleAdsId: null,
              googleAdsConversionLabel: null,
              pinterestId: null,
              hotjarId: null,
              clarityId: null,
              metaDomainVerification: null,
              analyticsConsent: true,
              marketingConsent: true,
            };

            const { data: pixelsData } = await supa
              .from("pixels_settings")
              .select("*")
              .eq("id", "pixels")
              .maybeSingle();

            const prod: PixelEnv = { ...defaultEnv, ...(pixelsData?.production || {}) };
            const staging: PixelEnv = { ...defaultEnv, ...(pixelsData?.staging || {}) };
            prod[pixelsField] = picked.id;
            staging[pixelsField] = picked.id;

            await supa
              .from("pixels_settings")
              .upsert(
                {
                  id: "pixels",
                  production: prod,
                  staging,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
              );
          }
        }
      }
    } catch (autoConfigError) {
      console.warn("[oauth-callback] auto-config failed:", autoConfigError);
    }

    // Redirect to canonical admin tracking page
    const to = new URL(origin);
    to.pathname = "/admin/tracking";
    return NextResponse.redirect(to);
  } catch (err: any) {
    const msg = err?.message || "callback_failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

type PixelEnv = {
  gtmId: string | null;
  ga4Id: string | null;
  metaPixelId: string | null;
  tiktokPixelId: string | null;
  googleAdsId: string | null;
  googleAdsConversionLabel: string | null;
  pinterestId: string | null;
  hotjarId: string | null;
  clarityId: string | null;
  metaDomainVerification: string | null;
  analyticsConsent: boolean;
  marketingConsent: boolean;
};
