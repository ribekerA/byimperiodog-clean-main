import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getProvider } from "@/lib/tracking/providers/registry";
import type { ProviderKey } from "@/lib/tracking/providers/types";

export type NormalizedResource = { id: string; name: string; extra?: Record<string, any> };

async function getIntegration(userId: string, provider: ProviderKey) {
  const supa = supabaseAdmin();
  const { data, error }: { data: any[] | null; error: any } = await supa
    .from("integrations")
    .select("id,user_id,provider,access_token,refresh_token,expires_at,provider_account_id,metadata")
    .eq("user_id", userId)
    .eq("provider", provider)
    .limit(1);
  if (error) throw error;
  return data && data[0] ? data[0] : null;
}

export async function listFacebookPixels(userId: string): Promise<NormalizedResource[]> {
  const integ = await getIntegration(userId, "facebook");
  if (!integ?.access_token) return [];
  const accessToken: string = integ.access_token;

  try {
    // Fetch ad accounts
    const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${accessToken}`);
    if (!accountsRes.ok) return [];
    const accountsJson = await accountsRes.json();
    const accounts = accountsJson.data || [];
    if (accounts.length === 0) return [];

    // Fetch pixels from first account
    const firstAccountId = accounts[0].id;
    const pixelsRes = await fetch(`https://graph.facebook.com/v18.0/${firstAccountId}/adspixels?access_token=${accessToken}`);
    if (!pixelsRes.ok) return [];
    const pixelsJson = await pixelsRes.json();
    const pixels = pixelsJson.data || [];
    return pixels.map((p: any) => ({
      id: p.id,
      name: p.name || `Pixel ${p.id}`,
      extra: { accountId: firstAccountId },
    }));
  } catch (err) {
    console.error("Error listing Facebook pixels:", err);
    return [];
  }
}

export async function listGAProperties(userId: string): Promise<NormalizedResource[]> {
  const integ = await getIntegration(userId, "google_analytics");
  if (!integ?.access_token) return [];
  const tokens = {
    accessToken: integ.access_token,
    refreshToken: integ.refresh_token || null,
    expiresAt: integ.expires_at ? Math.floor(new Date(integ.expires_at).getTime() / 1000) : null,
    tokenType: "Bearer",
  };

  try {
    const res = await fetch("https://analyticsadmin.googleapis.com/v1beta/properties", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const properties = json.properties || [];
    return properties.map((p: any) => ({
      id: p.name?.split("/").pop() || p.name,
      name: p.displayName || p.name,
      extra: { measurementId: p.measurementId },
    }));
  } catch (err) {
    console.error("Error listing GA properties:", err);
    return [];
  }
}

export async function listGTMContainers(userId: string): Promise<NormalizedResource[]> {
  const integ = await getIntegration(userId, "google_tag_manager");
  if (!integ?.access_token) return [];
  const accessToken: string = integ.access_token;

  try {
    const accountsRes = await fetch("https://www.googleapis.com/tagmanager/v2/accounts", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!accountsRes.ok) return [];
    const accountsJson = await accountsRes.json();
    const accounts = accountsJson.account || [];
    if (accounts.length === 0) return [];

    const firstAccount = accounts[0];
    const containersRes = await fetch(`https://www.googleapis.com/tagmanager/v2/${firstAccount.path}/containers`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!containersRes.ok) return [];
    const containersJson = await containersRes.json();
    const containers = containersJson.container || [];
    return containers.map((c: any) => ({
      id: c.publicId || c.containerId,
      name: c.name || c.publicId,
      extra: { accountId: firstAccount.accountId },
    }));
  } catch (err) {
    console.error("Error listing GTM containers:", err);
    return [];
  }
}

export async function listTikTokPixels(userId: string): Promise<NormalizedResource[]> {
  const integ = await getIntegration(userId, "tiktok");
  if (!integ?.access_token) return [];
  const accessToken: string = integ.access_token;

  try {
    // TikTok requires advertiser_id; you may need to fetch it first or store it
    // For now, attempt to list pixels if advertiser_id is in metadata
    const advertiserId = (integ.metadata as any)?.advertiser_id;
    if (!advertiserId) {
      console.warn("TikTok advertiser_id not found in integration metadata");
      return [];
    }
    const res = await fetch(`https://business-api.tiktok.com/open_api/v1.3/pixel/list/?advertiser_id=${advertiserId}`, {
      headers: {
        "Access-Token": accessToken,
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const pixels = json.data?.pixels || [];
    return pixels.map((p: any) => ({
      id: p.pixel_id || p.pixel_code,
      name: p.pixel_name || `Pixel ${p.pixel_id}`,
      extra: { advertiserId },
    }));
  } catch (err) {
    console.error("Error listing TikTok pixels:", err);
    return [];
  }
}
