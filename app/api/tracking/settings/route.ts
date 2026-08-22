export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { adminSessionFromRequest, requireAdminApi } from "@/lib/adminAuth";
import { respondWithError } from "@/lib/errors";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const logger = createLogger("api:tracking:settings");

/**
 * Ids sob os quais as configuracoes podem estar gravadas: o de quem esta na
 * sessao e, como segunda chave, o do ambiente — que era o unico usado antes.
 * O literal "admin" saiu: nao e usuario nenhum, e devolvia sempre vazio sem
 * indicar erro.
 */
async function idsDoUsuario(req: NextRequest): Promise<string[]> {
  const sessao = await adminSessionFromRequest(req);
  const doAmbiente = (process.env.ADMIN_USER_ID || process.env.DEFAULT_ADMIN_USER_ID || "").trim();
  return [sessao?.userId, doAmbiente].filter((v): v is string => Boolean(v));
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi(req, { permission: "settings:read" });
  if (guard) return guard;

  try {
    const ids = await idsDoUsuario(req);
    if (ids.length === 0) {
      return NextResponse.json({ error: "sem_usuario_para_consultar" }, { status: 400 });
    }
    const supa = supabaseAdmin();
    const { data, error } = await supa
      .from("tracking_settings")
      .select("facebook_pixel_id,ga_measurement_id,gtm_container_id,tiktok_pixel_id")
      .in("user_id", ids)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json(data || {}, { status: 200 });
  } catch (error) {
    logger.error("Falha ao obter tracking settings", { error: String(error) });
    return respondWithError(error);
  }
}
