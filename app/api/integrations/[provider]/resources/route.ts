export const dynamic = "force-dynamic";
/**
 * Lista os recursos do provedor (pixels, propriedades, containers).
 *
 * O portao aqui era `requireAdmin(req)` sem argumento: autenticava, mas nao
 * perguntava a funcao. Passa a exigir `settings:read`, e a consulta usa o id de
 * quem esta na sessao em vez de depender so de INTEGRATIONS_DEFAULT_USER_ID.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { adminSessionFromRequest, requireAdminApi } from "@/lib/adminAuth";
import { createLogger } from "@/lib/logger";
import type { ProviderKey } from "@/lib/tracking/providers/types";
import { listResourcesByProvider } from "@/lib/tracking/resources";

const logger = createLogger("api:integrations:resources");

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const guard = await requireAdminApi(req, { permission: "settings:read" });
  if (guard) return guard;

  const provider = params.provider as ProviderKey;
  const sessao = await adminSessionFromRequest(req);

  try {
    const resources = await listResourcesByProvider(provider, sessao?.userId);
    return NextResponse.json({ resources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed_to_list_resources";
    if (message === "integration_not_found" || message === "unsupported_provider") {
      return NextResponse.json({ error: message }, { status: message === "unsupported_provider" ? 400 : 404 });
    }
    // Mensagem crua pode citar variavel de ambiente ou resposta do provedor.
    logger.error("Falha ao listar recursos do provedor", { provider, error: String(error) });
    return NextResponse.json({ error: "failed_to_list_resources" }, { status: 500 });
  }
}
