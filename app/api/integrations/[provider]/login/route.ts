import { NextResponse } from "next/server";

import { requireAdminContext } from "@/lib/adminAuth";
import { erroPublico } from "@/lib/apiErro";
import { cookieDeState } from "@/lib/tracking/oauthState";
import { getProvider } from "@/lib/tracking/providers/registry";

export async function GET(_req: Request, props: { params: Promise<{ provider: string }> }) {
  const auth = requireAdminContext(_req, "settings:write");
  if (auth.response) return auth.response;
  const params = await props.params;
  const adapter = getProvider(params.provider);
  if (!adapter) {
    return NextResponse.json({ error: "unsupported_provider" }, { status: 400 });
  }

  try {
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const origin = new URL(configuredOrigin || _req.url).origin;
    const redirectUri = `${origin}/api/integrations/${adapter.id}/callback`;
    const state = crypto.randomUUID();
    const { authUrl } = await adapter.buildAuthUrl({ redirectUri, state });

    // O mesmo state vai para o provedor e para um cookie HttpOnly. O callback
    // só aceita o código se os dois baterem.
    const resposta = NextResponse.redirect(authUrl);
    resposta.headers.append("set-cookie", cookieDeState(adapter.id, state));
    resposta.headers.set("Cache-Control", "no-store");
    resposta.headers.set("Referrer-Policy", "no-referrer");
    return resposta;
  } catch (error: any) {
    return erroPublico("api/integrations/login", error, 500, { code: "login_failed" });
  }
}
