import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import type { ProviderKey } from "@/lib/tracking/providers/types";
import { listResourcesByProvider } from "@/lib/tracking/resources";

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const provider = params.provider as ProviderKey;

  try {
    const resources = await listResourcesByProvider(provider);
    return NextResponse.json({ resources });
  } catch (error: any) {
    const message = error?.message || "failed_to_list_resources";
    const status = message === "integration_not_found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
