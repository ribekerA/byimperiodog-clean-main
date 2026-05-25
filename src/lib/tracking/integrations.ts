import { supabaseAdmin } from "@/lib/supabaseAdmin";

import type { OAuthTokens, ProviderKey } from "./providers/types";

export type IntegrationRow = {
  id: string;
  user_id: string;
  provider: ProviderKey;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  provider_account_id: string | null;
  metadata: Record<string, unknown> | null;
};

const DEFAULT_USER_ID = process.env.INTEGRATIONS_DEFAULT_USER_ID;

export async function upsertIntegrationTokens(opts: {
  provider: ProviderKey;
  tokens: OAuthTokens;
  providerAccountId?: string | null;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}) {
  const userId = opts.userId || DEFAULT_USER_ID;
  if (!userId) {
    throw new Error("Missing userId for integration (set INTEGRATIONS_DEFAULT_USER_ID or pass userId)");
  }

  const supa = supabaseAdmin();
  const expiresAtIso =
    typeof opts.tokens.expiresAt === "number" ? new Date(opts.tokens.expiresAt * 1000).toISOString() : null;

  const { error } = await supa.from("integrations").upsert(
    {
      user_id: userId,
      provider: opts.provider,
      access_token: opts.tokens.accessToken,
      refresh_token: opts.tokens.refreshToken ?? null,
      expires_at: expiresAtIso,
      provider_account_id: opts.providerAccountId ?? null,
      metadata: opts.metadata ?? null,
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    throw new Error(`Failed to save integration tokens: ${error.message}`);
  }
}

export async function getIntegrationForUser(provider: ProviderKey, userId?: string) {
  const uid = userId || DEFAULT_USER_ID;
  if (!uid) {
    throw new Error("Missing userId for integration lookup");
  }
  const supa = supabaseAdmin();
  const { data, error } = await supa
    .from("integrations")
    .select("id, user_id, provider, access_token, refresh_token, expires_at, provider_account_id, metadata")
    .eq("user_id", uid)
    .eq("provider", provider)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load integration: ${error.message}`);
  }
  return data as IntegrationRow | null;
}
