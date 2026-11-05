import type { OAuthInfo, OAuthTokens, ProviderAdapter, Resource } from "./types";

const FB_AUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth";
const FB_TOKEN_URL = "https://graph.facebook.com/v18.0/oauth/access_token";

const facebookAdapter: ProviderAdapter = {
  id: "facebook",

  buildAuthUrl: ({ redirectUri, state }): OAuthInfo => {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    if (!clientId) {
      throw new Error("FACEBOOK_CLIENT_ID is not configured");
    }
    const scope = ["ads_read", "business_management"];
    const url = new URL(FB_AUTH_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope.join(","));
    return { authUrl: url.toString(), scope, provider: "facebook" };
  },

  exchangeCode: async ({ code, redirectUri }): Promise<OAuthTokens> => {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("FACEBOOK_CLIENT_ID/SECRET not configured");
    }
    const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code });
    const res = await fetch(FB_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      throw new Error(`Facebook token exchange failed: ${res.status}`);
    }
    const json = await res.json();
    return {
      accessToken: json.access_token,
      refreshToken: null, // FB uses long-lived tokens via another exchange; add if needed.
      expiresAt: json.expires_in ? Math.floor(Date.now() / 1000) + Number(json.expires_in) : null,
      tokenType: json.token_type ?? "bearer",
    };
  },

  listResources: async (tokens): Promise<Resource[]> => {
    const accountsResponse = await fetch("https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name&limit=100", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    if (!accountsResponse.ok) throw new Error(`Facebook accounts request failed: ${accountsResponse.status}`);
    const accounts = (await accountsResponse.json()).data || [];
    const resources: Resource[] = [];
    for (const account of accounts) {
      const pixelsResponse = await fetch(`https://graph.facebook.com/v18.0/${encodeURIComponent(account.id)}/adspixels?fields=id,name&limit=100`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!pixelsResponse.ok) continue;
      const pixels = (await pixelsResponse.json()).data || [];
      for (const pixel of pixels) {
        resources.push({ id: pixel.id, name: pixel.name || `Pixel ${pixel.id}`, type: "meta_pixel", meta: { account: account.name || account.id } });
      }
    }
    return resources;
  },
};

export default facebookAdapter;
