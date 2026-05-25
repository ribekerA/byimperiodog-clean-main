import facebookAdapter from "./facebook";
import { googleAnalyticsAdapter, googleTagManagerAdapter } from "./google";
import type { ProviderAdapter, ProviderKey } from "./types";

// Placeholder for TikTok; implement when ready.
const tiktokAdapter: ProviderAdapter = {
  id: "tiktok",
  buildAuthUrl: ({ redirectUri, state }) => {
    const scope = ["pixel.event.read", "pixel.event.manage"]; // placeholder scopes
    const base = process.env.TIKTOK_AUTH_URL || "https://business-api.tiktok.com/portal/auth";
    const clientId = process.env.TIKTOK_CLIENT_ID;
    if (!clientId) throw new Error("TIKTOK_CLIENT_ID is not configured");
    const url = new URL(base);
    url.searchParams.set("client_key", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope.join(","));
    return { authUrl: url.toString(), scope, provider: "tiktok" };
  },
  exchangeCode: async (_opts) => {
    throw new Error("TikTok exchangeCode not implemented yet");
  },
  listResources: async () => {
    return [];
  },
};

export const providers: Record<ProviderKey, ProviderAdapter> = {
  facebook: facebookAdapter,
  google_analytics: googleAnalyticsAdapter,
  google_tag_manager: googleTagManagerAdapter,
  tiktok: tiktokAdapter,
};

export function getProvider(key: string): ProviderAdapter | null {
  return providers[key as ProviderKey] ?? null;
}
