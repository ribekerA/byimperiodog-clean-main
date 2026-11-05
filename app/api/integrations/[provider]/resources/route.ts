import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdminContext } from "@/lib/adminAuth";
import type { ProviderKey } from "@/lib/tracking/providers/types";
import { listResourcesByProvider } from "@/lib/tracking/resources";

export async function GET(req: NextRequest, props: { params: Promise<{ provider: string }> }) {
  const params = await props.params;
  const auth = await requireAdminContext(req, "settings:write");
  if (auth.response) return auth.response;

  const provider = params.provider as ProviderKey;

  try {
    const resources = await listResourcesByProvider(provider, auth.context!.session!.userId);
    return NextResponse.json({ resources });
  } catch (error: any) {
    const message = error?.message || "failed_to_list_resources";
    const status = message === "integration_not_found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
