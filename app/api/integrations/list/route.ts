export const dynamic = "force-dynamic";
/**
 * Quais provedores estao conectados.
 *
 * Antes, a rota conferia a sessao mas nao a funcao — qualquer pessoa logada no
 * painel, inclusive `viewer`, via o estado das integracoes. E, quando nao havia
 * ADMIN_USER_ID no ambiente, ela consultava pelo id literal "admin", que nao e
 * usuario nenhum: o resultado era sempre "nada conectado", sem erro.
 *
 * Agora exige `settings:read` e consulta pelo id de quem esta na sessao,
 * mantendo o id do ambiente como segunda chave para nao perder de vista as
 * linhas gravadas antes desta mudanca.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { adminSessionFromRequest, requireAdminApi } from "@/lib/adminAuth";
import { respondWithError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("api:integrations:list");

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi(req, { permission: "settings:read" });
  if (guard) return guard;

  try {
    const sessao = await adminSessionFromRequest(req);
    const doAmbiente = (process.env.ADMIN_USER_ID || process.env.DEFAULT_ADMIN_USER_ID || "").trim();
    const ids = [sessao?.userId, doAmbiente].filter((v): v is string => Boolean(v));
    if (ids.length === 0) {
      return NextResponse.json({ error: "sem_usuario_para_consultar" }, { status: 400 });
    }

    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from("integrations")
      .select("provider,id,access_token")
      .in("user_id", ids);
    if (error) throw error;

    const providers: Array<{ provider: string; connected: boolean }> = [
      { provider: "facebook", connected: false },
      { provider: "google_analytics", connected: false },
      { provider: "google_tag_manager", connected: false },
      { provider: "tiktok", connected: false },
    ];
    (data || []).forEach((row: { provider: string; access_token: string | null }) => {
      const idx = providers.findIndex((p) => p.provider === row.provider);
      if (idx >= 0) providers[idx].connected = Boolean(row.access_token);
    });
    return NextResponse.json(providers, { status: 200 });
  } catch (error) {
    logger.error("Falha ao listar integrações", { error: String(error) });
    return respondWithError(error);
  }
}
