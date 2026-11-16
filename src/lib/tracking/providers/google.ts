import { listarContasComToken } from "@/lib/google-ads/accounts";
import { ESCOPO_ADS } from "@/lib/google-ads/config";

import type { OAuthInfo, OAuthTokens, ProviderAdapter, ProviderKey, Resource } from "./types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function getGoogleScopes(provider: ProviderKey): string[] {
  if (provider === "google_tag_manager") {
    return [
      "https://www.googleapis.com/auth/tagmanager.readonly", // containers
    ];
  }
  if (provider === "google_ads") {
    // Escopo unico e de LEITURA E ESCRITA: a API do Google Ads nao tem escopo
    // separado para consultar e para alterar. Quem conecta aqui autoriza criar
    // campanha e mexer em orcamento, nao so ver relatorio -- e por isso a tela
    // de admin diz isso em voz alta antes do botao de conectar.
    return [ESCOPO_ADS];
  }
  // default GA4 scopes
  return [
    "https://www.googleapis.com/auth/analytics.readonly",
  ];
}

async function exchangeGoogleCode(code: string, redirectUri: string): Promise<OAuthTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID/SECRET not configured");
  }
  const body = new URLSearchParams();
  body.set("code", code);
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("redirect_uri", redirectUri);
  body.set("grant_type", "authorization_code");

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);
  const json = await res.json();
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: json.expires_in ? Math.floor(Date.now() / 1000) + Number(json.expires_in) : null,
    tokenType: json.token_type ?? "Bearer",
  };
}

async function refreshGoogleToken(refreshToken: string): Promise<OAuthTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID/SECRET not configured");
  }
  const body = new URLSearchParams();
  body.set("refresh_token", refreshToken);
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("grant_type", "refresh_token");

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${res.status}`);
  const json = await res.json();
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: json.expires_in ? Math.floor(Date.now() / 1000) + Number(json.expires_in) : null,
    tokenType: json.token_type ?? "Bearer",
  };
}

async function listGoogleAnalyticsResources(tokens: OAuthTokens): Promise<Resource[]> {
  try {
    // accountSummaries lista somente contas/propriedades visíveis ao usuário e
    // não exige o escopo de edição.
    const res = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200", {
      headers: {
        Authorization: `${tokens.tokenType || "Bearer"} ${tokens.accessToken}`,
      },
    });
    if (!res.ok) {
      console.warn("Failed to fetch GA properties:", res.status);
      return [];
    }
    const json = await res.json();
    const accounts = Array.isArray(json.accountSummaries) ? json.accountSummaries : [];
    return accounts.flatMap((account: any) =>
      (Array.isArray(account.propertySummaries) ? account.propertySummaries : []).map((property: any) => ({
        id: property.property?.split("/").pop() || property.property,
        name: property.displayName || property.property,
        type: "ga4_property",
        meta: { account: account.displayName || account.account || "" },
      })),
    );
  } catch (err) {
    console.error("Error listing GA properties:", err);
    return [];
  }
}

async function listGoogleTagManagerResources(tokens: OAuthTokens): Promise<Resource[]> {
  try {
    // First, get accounts
    const accountsRes = await fetch("https://www.googleapis.com/tagmanager/v2/accounts", {
      headers: {
        Authorization: `${tokens.tokenType || "Bearer"} ${tokens.accessToken}`,
      },
    });
    if (!accountsRes.ok) {
      console.warn("Failed to fetch GTM accounts:", accountsRes.status);
      return [];
    }
    const accountsJson = await accountsRes.json();
    const accounts = accountsJson.account || [];
    if (accounts.length === 0) return [];

    // Fetch containers from first account
    const firstAccount = accounts[0];
    const containersRes = await fetch(`https://www.googleapis.com/tagmanager/v2/${firstAccount.path}/containers`, {
      headers: {
        Authorization: `${tokens.tokenType || "Bearer"} ${tokens.accessToken}`,
      },
    });
    if (!containersRes.ok) {
      console.warn("Failed to fetch GTM containers:", containersRes.status);
      return [];
    }
    const containersJson = await containersRes.json();
    const containers = containersJson.container || [];
    return containers.map((c: any) => ({
      id: c.publicId || c.containerId,
      name: c.name || c.publicId,
      extra: { accountId: firstAccount.accountId, accountName: firstAccount.name },
    }));
  } catch (err) {
    console.error("Error listing GTM containers:", err);
    return [];
  }
}

const googleAnalyticsAdapter: ProviderAdapter = {
  id: "google_analytics",
  buildAuthUrl: ({ redirectUri, state }): OAuthInfo => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || clientId.includes("your-google")) {
      throw new Error("❌ Configure GOOGLE_CLIENT_ID no .env.local - Veja: https://console.cloud.google.com/apis/credentials");
    }
    if (!clientSecret || clientSecret.includes("your-google")) {
      throw new Error("❌ Configure GOOGLE_CLIENT_SECRET no .env.local");
    }
    const scope = getGoogleScopes("google_analytics");
    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);
    url.searchParams.set("scope", scope.join(" "));
    return { authUrl: url.toString(), scope, provider: "google_analytics" };
  },
  exchangeCode: ({ code, redirectUri }) => exchangeGoogleCode(code, redirectUri),
  refreshTokens: refreshGoogleToken,
  listResources: listGoogleAnalyticsResources,
};

const googleTagManagerAdapter: ProviderAdapter = {
  id: "google_tag_manager",
  buildAuthUrl: ({ redirectUri, state }): OAuthInfo => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not configured");
    const scope = getGoogleScopes("google_tag_manager");
    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);
    url.searchParams.set("scope", scope.join(" "));
    return { authUrl: url.toString(), scope, provider: "google_tag_manager" };
  },
  exchangeCode: ({ code, redirectUri }) => exchangeGoogleCode(code, redirectUri),
  refreshTokens: refreshGoogleToken,
  listResources: listGoogleTagManagerResources,
};

async function listGoogleAdsResources(tokens: OAuthTokens): Promise<Resource[]> {
  try {
    const contas = await listarContasComToken(tokens.accessToken);
    return contas.map((conta) => ({
      id: conta.id,
      name: conta.nome,
      type: "google_ads_customer",
      meta: {
        // Tudo string: o tipo Resource.meta e Record<string, string>, e a tela
        // so precisa exibir. Quem decide por estes campos e a pessoa olhando a
        // lista -- uma conta de teste ou um gerenciador nao servem para rodar
        // anuncio de verdade, e a etiqueta evita a escolha errada.
        moeda: conta.moeda ?? "",
        fusoHorario: conta.fusoHorario ?? "",
        gerenciador: conta.gerenciador ? "1" : "",
        contaDeTeste: conta.contaDeTeste ? "1" : "",
      },
    }));
  } catch (err) {
    console.error("Error listing Google Ads accounts:", err);
    return [];
  }
}

const googleAdsAdapter: ProviderAdapter = {
  id: "google_ads",
  buildAuthUrl: ({ redirectUri, state }): OAuthInfo => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || clientId.includes("your-google")) {
      throw new Error(
        "❌ Configure GOOGLE_CLIENT_ID no .env.local - Veja: https://console.cloud.google.com/apis/credentials",
      );
    }
    if (!clientSecret || clientSecret.includes("your-google")) {
      throw new Error("❌ Configure GOOGLE_CLIENT_SECRET no .env.local");
    }
    // Aqui havia uma terceira trava exigindo GOOGLE_ADS_DEVELOPER_TOKEN antes de
    // abrir a tela do Google. Saiu porque o Google desligou o developer token em
    // 09/09/2026: o nivel de acesso passou a pertencer ao projeto do Google Cloud
    // que emitiu estas credenciais, e a trava recusava o login por uma credencial
    // que a API nao le mais. Projeto em nivel "Test" conecta e responde so por
    // conta de teste -- conta real voltando vazia e nivel de projeto, nao falta de
    // token.
    const scope = getGoogleScopes("google_ads");
    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);
    url.searchParams.set("scope", scope.join(" "));
    return { authUrl: url.toString(), scope, provider: "google_ads" };
  },
  exchangeCode: ({ code, redirectUri }) => exchangeGoogleCode(code, redirectUri),
  refreshTokens: refreshGoogleToken,
  listResources: listGoogleAdsResources,
};

export { googleAdsAdapter, googleAnalyticsAdapter, googleTagManagerAdapter };
