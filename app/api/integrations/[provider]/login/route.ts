import { NextResponse } from "next/server";

import { getProvider } from "@/lib/tracking/providers/registry";

export async function GET(
  _req: Request,
  { params }: { params: { provider: string } }
) {
  const adapter = getProvider(params.provider);
  if (!adapter) {
    return NextResponse.json({ error: "unsupported_provider" }, { status: 400 });
  }

  try {
    const url = new URL(_req.url);
    const origin = url.origin;
    const redirectUri = `${origin}/api/integrations/${adapter.id}/callback`;
    const state = crypto.randomUUID();
    const { authUrl } = await adapter.buildAuthUrl({ redirectUri, state });

    // Optionally store state in a cookie/session here for validation.

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "login_failed" }, { status: 500 });
  }
}
