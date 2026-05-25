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
    const scope = ["ads_management", "business_management"];
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
    const url = new URL(FB_TOKEN_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("client_secret", clientSecret);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("code", code);

    const res = await fetch(url.toString(), { method: "GET" });
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

  // Facebook pixels listing would normally hit /me/adaccounts then /act_x/pixels.
  // Stubbed here; fill with real API calls using accessToken.
  listResources: async (_tokens): Promise<Resource[]> => {
    return [];
  },
};

export default facebookAdapter;
