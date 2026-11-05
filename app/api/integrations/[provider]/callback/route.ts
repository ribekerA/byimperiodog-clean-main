import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdminContext } from "@/lib/adminAuth";
import { upsertIntegrationTokens } from "@/lib/tracking/integrations";
import { cookieDeState, lerCookie, nomeDoCookieDeState, stateConfere } from "@/lib/tracking/oauthState";
import { getProvider } from "@/lib/tracking/providers/registry";

function applicationOrigin(requestUrl: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return new URL(configured || requestUrl).origin;
}

function clearState(response: NextResponse, provider: string): NextResponse {
  response.headers.append("set-cookie", cookieDeState(provider, "", 0));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(req: NextRequest, props: { params: Promise<{ provider: string }> }) {
  const admin = requireAdminContext(req, "settings:write");
  if (admin.response) return admin.response;

  const { provider = "" } = await props.params;
  const adapter = getProvider(provider.trim());
  if (!adapter) return NextResponse.json({ ok: false, error: "unsupported_provider" }, { status: 400 });

  const params = new URL(req.url).searchParams;
  const code = params.get("code") || "";
  const state = params.get("state") || "";
  const providerError = params.get("error");
  const expectedState = lerCookie(req, nomeDoCookieDeState(adapter.id));

  if (providerError || !code || code.length > 4096 || !stateConfere(state, expectedState)) {
    const status = providerError ? 400 : !code ? 400 : 403;
    return clearState(NextResponse.json({ ok: false, error: "oauth_callback_invalid" }, { status }), adapter.id);
  }

  try {
    const origin = applicationOrigin(req.url);
    const redirectUri = `${origin}/api/integrations/${adapter.id}/callback`;
    const tokens = await adapter.exchangeCode({ code, redirectUri });
    await upsertIntegrationTokens({
      userId: admin.context.session.userId,
      provider: adapter.id,
      tokens,
      metadata: {},
    });

    const destination = new URL("/admin/tracking", origin);
    destination.searchParams.set("connected", adapter.id);
    return clearState(NextResponse.redirect(destination), adapter.id);
  } catch (error) {
    console.error("[oauth-callback] conexão recusada", error instanceof Error ? error.message : String(error));
    return clearState(
      NextResponse.json({ ok: false, error: "callback_failed" }, { status: 502 }),
      adapter.id,
    );
  }
}

export const dynamic = "force-dynamic";
