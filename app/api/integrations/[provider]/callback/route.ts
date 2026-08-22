export const dynamic = "force-dynamic";
/**
 * Volta do provedor de OAuth (Meta, GA4, GTM).
 *
 * Esta era a rota mais perigosa do projeto depois do webhook do WhatsApp, e por
 * um motivo que nao esta na troca de tokens: no fim dela havia um bloco de
 * "auto-configuracao" que gravava em `tracking_settings` e em `pixels_settings`.
 * Como a rota era publica e nao conferia nada, uma pessoa de fora conseguia
 * trocar o ID de GA4, de GTM e do pixel da Meta do site inteiro — ou seja,
 * desviar a medicao de campanha do canil para a conta dela.
 *
 * O que foi corrigido:
 *
 * 1. Exige sessao de administrador. A volta do provedor e navegacao de primeiro
 *    nivel, entao o cookie `lax` chega normalmente; quem nao estiver logado no
 *    painel simplesmente nao fecha o fluxo.
 * 2. Confere o `state` contra o cookie assinado emitido no /login, em tempo
 *    constante e uma vez so. Antes, `state` ausente virava um aviso no console e
 *    o fluxo seguia — o que abria vinculacao de conta por CSRF.
 * 3. Manda o verificador PKCE na troca do code.
 * 4. O dono do token e quem esta na sessao. Sumiu o `TEST_USER_ID`, que era uma
 *    variavel de teste lida em producao, e sumiu o `user_id: null`, que gravava
 *    integracao sem dono.
 * 5. Os tokens vao cifrados para o banco (AES-256-GCM, ver src/lib/tokenCipher).
 * 6. Erro de upsert deixou de ser `console.warn` e seguir: se nao gravou, a
 *    pessoa precisa saber que nao gravou.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { adminSessionFromRequest, requireAdminApi } from "@/lib/adminAuth";
import { createLogger } from "@/lib/logger";
import { conferirEstadoOAuth, OAUTH_STATE_COOKIE } from "@/lib/oauthState";
import { ChaveDeCifraAusente, cifrarToken, cifrarTokenOpcional } from "@/lib/tokenCipher";
import { getProvider } from "@/lib/tracking/providers/registry";
import type { OAuthTokens } from "@/lib/tracking/providers/types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("api:integrations:callback");

type PixelEnv = {
  gtmId: string | null;
  ga4Id: string | null;
  metaPixelId: string | null;
  tiktokPixelId: string | null;
  googleAdsId: string | null;
  googleAdsConversionLabel: string | null;
  pinterestId: string | null;
  hotjarId: string | null;
  clarityId: string | null;
  metaDomainVerification: string | null;
  analyticsConsent: boolean;
  marketingConsent: boolean;
};

/** Os campos de PixelEnv que guardam identificador, e nao consentimento. */
type CampoDePixelDeTexto = "metaPixelId" | "ga4Id" | "gtmId" | "tiktokPixelId";

/** Resposta de erro que ja limpa o cookie de estado: ele vale uma vez so. */
function recusar(mensagem: string, status: number) {
  const resposta = NextResponse.json({ ok: false, error: mensagem }, { status });
  resposta.cookies.delete(OAUTH_STATE_COOKIE);
  return resposta;
}

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const guard = await requireAdminApi(req, { permission: "settings:write" });
  if (guard) return guard;

  const sessao = await adminSessionFromRequest(req);
  if (!sessao) {
    return recusar("sessao_de_pessoa_exigida", 403);
  }

  const providerKey = (params?.provider || "").trim();
  const adapter = getProvider(providerKey);
  if (!adapter) {
    return recusar("unsupported_provider", 400);
  }

  const qs = new URL(req.url).searchParams;
  const code = qs.get("code") || "";
  const state = qs.get("state") || "";
  if (!code) {
    return recusar("missing_code", 400);
  }

  const estado = await conferirEstadoOAuth({
    cookie: req.cookies.get(OAUTH_STATE_COOKIE)?.value,
    stateRecebido: state,
    provider: providerKey,
  });
  if (!estado) {
    logger.warn("Callback de OAuth recusado por estado invalido", { provider: providerKey });
    return recusar("invalid_state", 400);
  }

  // Quem terminou tem de ser quem comecou. Sem isto, um administrador poderia
  // fechar, sem perceber, o fluxo aberto por outro.
  if (estado.userId !== sessao.userId) {
    logger.warn("Callback de OAuth recusado: sessao diferente da que iniciou o fluxo", {
      provider: providerKey,
    });
    return recusar("state_owner_mismatch", 403);
  }

  const userId = sessao.userId;

  try {
    const origin = new URL(req.url).origin;
    const redirectUri = `${origin}/api/integrations/${providerKey}/callback`;
    const tokens = await adapter.exchangeCode({
      code,
      redirectUri,
      codeVerifier: estado.verifier,
    });

    const supa = supabaseAdmin();

    const payload: Record<string, unknown> = {
      user_id: userId,
      provider: adapter.id,
      access_token: await cifrarToken(tokens.accessToken),
      refresh_token: await cifrarTokenOpcional(tokens.refreshToken),
      expires_at: tokens.expiresAt ? new Date(tokens.expiresAt * 1000).toISOString() : null,
      provider_account_id: (tokens as { accountId?: string }).accountId ?? null,
      metadata: {},
    };

    const { error } = await supa
      .from("integrations")
      .upsert(payload, { onConflict: "user_id,provider" });
    if (error) {
      // Antes isto era um aviso no console e a rota redirecionava como se
      // tivesse dado certo: a pessoa via "conectado" e nada tinha sido salvo.
      logger.error("Falha ao gravar a integracao", { provider: adapter.id, error: error.message });
      return recusar("persist_failed", 500);
    }

    await autoConfigurarPrimeiroRecurso({ supa, providerKey, tokens, userId });

    const to = new URL(origin);
    to.pathname = "/admin/tracking";
    const resposta = NextResponse.redirect(to);
    resposta.cookies.delete(OAUTH_STATE_COOKIE);
    return resposta;
  } catch (err) {
    if (err instanceof ChaveDeCifraAusente) {
      logger.error("INTEGRATIONS_ENCRYPTION_KEY ausente; integracao nao foi gravada");
      return recusar("encryption_key_missing", 503);
    }
    // A mensagem original pode carregar trecho de resposta do provedor.
    logger.error("Falha no callback de OAuth", { provider: providerKey, error: String(err) });
    return recusar("callback_failed", 500);
  }
}

/**
 * Preenche o primeiro recurso encontrado (pixel, propriedade, container).
 *
 * Continua sendo automatico, como era antes — o que mudou e que agora so chega
 * aqui quem passou pelo portao, pelo `state` e pela troca de tokens.
 */
async function autoConfigurarPrimeiroRecurso(opts: {
  supa: ReturnType<typeof supabaseAdmin>;
  providerKey: string;
  tokens: OAuthTokens;
  userId: string;
}) {
  const { supa, providerKey, tokens, userId } = opts;

  try {
    const adapter = getProvider(providerKey);
    if (!adapter?.listResources) return;

    const resources = await adapter.listResources(tokens);
    if (!resources || resources.length === 0) return;

    const picked = resources[0];
    const patch: Record<string, string> = {};
    let pixelsField: CampoDePixelDeTexto | null = null;

    switch (providerKey) {
      case "facebook":
        patch["facebook_pixel_id"] = picked.id;
        pixelsField = "metaPixelId";
        break;
      case "google_analytics":
        patch["ga_measurement_id"] = picked.id;
        pixelsField = "ga4Id";
        break;
      case "google_tag_manager":
        patch["gtm_container_id"] = picked.id;
        pixelsField = "gtmId";
        break;
      case "tiktok":
        patch["tiktok_pixel_id"] = picked.id;
        pixelsField = "tiktokPixelId";
        break;
    }

    if (Object.keys(patch).length > 0) {
      await supa.from("tracking_settings").upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
    }

    if (!pixelsField) return;

    const defaultEnv: PixelEnv = {
      gtmId: null,
      ga4Id: null,
      metaPixelId: null,
      tiktokPixelId: null,
      googleAdsId: null,
      googleAdsConversionLabel: null,
      pinterestId: null,
      hotjarId: null,
      clarityId: null,
      metaDomainVerification: null,
      analyticsConsent: true,
      marketingConsent: true,
    };

    const { data: pixelsData } = await supa
      .from("pixels_settings")
      .select("*")
      .eq("id", "pixels")
      .maybeSingle();

    const prod: PixelEnv = { ...defaultEnv, ...(pixelsData?.production || {}) };
    const staging: PixelEnv = { ...defaultEnv, ...(pixelsData?.staging || {}) };
    prod[pixelsField] = picked.id;
    staging[pixelsField] = picked.id;

    await supa.from("pixels_settings").upsert(
      {
        id: "pixels",
        production: prod,
        staging,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (autoConfigError) {
    // Falhar aqui nao invalida a conexao: o token ja foi gravado e a pessoa
    // consegue escolher o recurso na mao no painel.
    logger.warn("Auto-configuracao do primeiro recurso falhou", {
      provider: providerKey,
      error: String(autoConfigError),
    });
  }
}
