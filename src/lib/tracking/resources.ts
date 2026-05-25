import { getIntegrationForUser } from "@/lib/tracking/integrations";
import type { ProviderKey, Resource } from "@/lib/tracking/providers/types";

const DEFAULT_USER_ID = process.env.INTEGRATIONS_DEFAULT_USER_ID;

async function requireIntegration(provider: ProviderKey, userId?: string) {
  const integration = await getIntegrationForUser(provider, userId);
  if (!integration) {
    throw new Error("integration_not_found");
  }
  return integration;
}

export async function listFacebookPixels(userId?: string): Promise<Resource[]> {
  await requireIntegration("facebook", userId);
  // TODO: Call Facebook Marketing API to list pixels
  return [];
}

export async function listGAProperties(userId?: string): Promise<Resource[]> {
  await requireIntegration("google_analytics", userId);
  // TODO: Call Google Analytics Admin API to list GA4 properties/streams
  return [];
}

export async function listGTMContainers(userId?: string): Promise<Resource[]> {
  await requireIntegration("google_tag_manager", userId);
  // TODO: Call Google Tag Manager API to list containers
  return [];
}

export async function listTikTokPixels(userId?: string): Promise<Resource[]> {
  await requireIntegration("tiktok", userId);
  // TODO: Call TikTok Business API to list pixels
  return [];
}

export async function listResourcesByProvider(provider: ProviderKey, userId?: string): Promise<Resource[]> {
  switch (provider) {
    case "facebook":
      return listFacebookPixels(userId || DEFAULT_USER_ID || undefined);
    case "google_analytics":
      return listGAProperties(userId || DEFAULT_USER_ID || undefined);
    case "google_tag_manager":
      return listGTMContainers(userId || DEFAULT_USER_ID || undefined);
    case "tiktok":
      return listTikTokPixels(userId || DEFAULT_USER_ID || undefined);
    default:
      throw new Error("unsupported_provider");
  }
}
