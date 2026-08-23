import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { respondWithError } from "@/lib/errors";
import { rateLimit } from "@/lib/limiter";
import { createLogger } from "@/lib/logger";
import { safeAction } from "@/lib/safeAction";
import { adminCadastroSchema } from "@/lib/schemas/adminCadastros";

const logger = createLogger("api:admin:cadastros");

const execute = safeAction({
  schema: adminCadastroSchema,
  handler: async (payload, { req }) => {
    await rateLimit(req, { identifier: "admin-cadastros", limit: 5, windowMs: 60_000 });
    const id =
      globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    logger.info("Cadastro registrado", { id });
    return { id, data: payload };
  },
  logger,
});

export async function POST(req: NextRequest) {
  const guard = requireAdminApi(req, { permission: "cadastros:write" });
  if (guard) return guard;

  try {
    const result = await execute(req);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.warn("Falha ao processar cadastro", { error: String(error) });
    return respondWithError(error);
  }
}
