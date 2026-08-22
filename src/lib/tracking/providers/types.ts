export type ProviderKey = "facebook" | "google_analytics" | "google_tag_manager" | "tiktok";

export type OAuthTokens = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: number | null; // epoch seconds
  tokenType?: string | null;
};

export type OAuthInfo = {
  authUrl: string;
  scope: string[];
  provider: ProviderKey;
};

export type Resource = {
  id: string;
  name: string;
  type?: string;
  meta?: Record<string, string>;
};

export type ProviderAdapter = {
  id: ProviderKey;
  /**
   * Build the authorization URL for OAuth
   */
  buildAuthUrl: (opts: {
    redirectUri: string;
    state: string;
    /** Desafio PKCE (S256). O verificador correspondente fica no cookie de estado. */
    codeChallenge?: string;
  }) => Promise<OAuthInfo> | OAuthInfo;
  /**
   * Exchange authorization code for tokens
   */
  exchangeCode: (opts: {
    code: string;
    redirectUri: string;
    /** Verificador PKCE. Sem ele o provedor recusa o code quando houve desafio. */
    codeVerifier?: string;
  }) => Promise<OAuthTokens>;
  /**
   * Refresh tokens (if supported)
   */
  refreshTokens?: (refreshToken: string) => Promise<OAuthTokens>;
  /**
   * List resources (pixels, properties, containers, etc.) using the current token
   */
  listResources: (tokens: OAuthTokens) => Promise<Resource[]>;
};
