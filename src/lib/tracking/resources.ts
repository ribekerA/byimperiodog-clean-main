import { getIntegrationForUser, upsertIntegrationTokens } from "@/lib/tracking/integrations";
import { getProvider } from "@/lib/tracking/providers/registry";
import type { OAuthTokens, ProviderKey, Resource } from "@/lib/tracking/providers/types";

export async function listResourcesByProvider(provider: ProviderKey, userId?: string): Promise<Resource[]> {
  if (!userId) throw new Error("authenticated_user_required");
  const adapter = getProvider(provider);
  if (!adapter) throw new Error("unsupported_provider");
  const integration = await getIntegrationForUser(provider, userId);
  if (!integration) throw new Error("integration_not_found");

  let tokens: OAuthTokens = {
    accessToken: integration.access_token,
    refreshToken: integration.refresh_token,
    expiresAt: integration.expires_at ? Math.floor(new Date(integration.expires_at).getTime() / 1000) : null,
    tokenType: "Bearer",
  };

  const expiresSoon = typeof tokens.expiresAt === "number" && tokens.expiresAt <= Math.floor(Date.now() / 1000) + 60;
  if (expiresSoon) {
    if (!tokens.refreshToken || !adapter.refreshTokens) throw new Error("integration_reconnect_required");
    tokens = await adapter.refreshTokens(tokens.refreshToken);
    await upsertIntegrationTokens({
      userId,
      provider,
      tokens,
      providerAccountId: integration.provider_account_id,
      metadata: integration.metadata,
    });
  }

  return adapter.listResources(tokens);
}
