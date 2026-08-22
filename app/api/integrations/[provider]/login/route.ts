export const dynamic = "force-dynamic";
/**
 * Inicio do fluxo OAuth de integracao (Meta, GA4, GTM).
 *
 * Duas coisas mudaram aqui.
 *
 * 1. A rota era publica. Qualquer pessoa abria /api/integrations/facebook/login
 *    e comecava um fluxo de vinculacao com a conta dela. Agora exige sessao de
 *    administrador com permissao de escrita em configuracoes — conectar uma
 *    conta de anuncios ao site e mexer em infraestrutura, nao e leitura.
 *
 * 2. O `state` era sorteado e jogado fora. Havia ate um comentario dizendo
 *    "opcionalmente guarde o state num cookie para validar". Agora ele vai num
 *    cookie httpOnly assinado, junto com o verificador PKCE, e o /callback so
 *    aceita a volta que corresponder a esse cookie.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { adminSessionFromRequest, requireAdminApi } from "@/lib/adminAuth";
import { createLogger } from "@/lib/logger";
import { criarEstadoOAuth, OAUTH_STATE_COOKIE, OAUTH_STATE_MAX_AGE } from "@/lib/oauthState";
import { getProvider } from "@/lib/tracking/providers/registry";

const logger = createLogger("api:integrations:login");

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const guard = await requireAdminApi(req, { permission: "settings:write" });
  if (guard) return guard;

  const adapter = getProvider(params.provider);
  if (!adapter) {
    return NextResponse.json({ error: "unsupported_provider" }, { status: 400 });
  }

  const sessao = await adminSessionFromRequest(req);
  if (!sessao) {
    // Segredo de maquina nao serve aqui: o token precisa ser gravado no nome de
    // uma pessoa, e integracao de OAuth e um fluxo de navegador.
    return NextResponse.json({ error: "sessao_de_pessoa_exigida" }, { status: 403 });
  }

  try {
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/integrations/${adapter.id}/callback`;

    const { state, codeChallenge, cookie } = await criarEstadoOAuth({
      provider: adapter.id,
      userId: sessao.userId,
    });

    const { authUrl } = await adapter.buildAuthUrl({ redirectUri, state, codeChallenge });

    const resposta = NextResponse.redirect(authUrl);
    resposta.cookies.set(OAUTH_STATE_COOKIE, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // `lax` porque a volta do provedor e navegacao de primeiro nivel: com
      // `strict` o cookie nao chegaria no /callback e o fluxo nunca fecharia.
      sameSite: "lax",
      path: "/api/integrations",
      maxAge: OAUTH_STATE_MAX_AGE,
    });
    return resposta;
  } catch (error) {
    // A mensagem do adaptador pode citar nome de variavel de ambiente; fica no
    // log do servidor, nao na resposta.
    logger.error("Falha ao montar a URL de autorizacao", {
      provider: adapter.id,
      error: String(error),
    });
    return NextResponse.json({ error: "login_failed" }, { status: 500 });
  }
}
