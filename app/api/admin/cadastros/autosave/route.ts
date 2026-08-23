import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { respondWithError } from "@/lib/errors";
import { rateLimit } from "@/lib/limiter";
import { createLogger } from "@/lib/logger";
import { safeAction } from "@/lib/safeAction";
import { adminCadastroAutosaveSchema } from "@/lib/schemas/adminCadastros";

const logger = createLogger("api:admin:cadastros-autosave");

const execute = safeAction({
  schema: adminCadastroAutosaveSchema,
  handler: async (payload, { req }) => {
    await rateLimit(req, { identifier: "admin-cadastros-autosave", limit: 12, windowMs: 60_000 });
    return {
      received: payload,
      savedAt: new Date().toISOString(),
    };
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
    logger.warn("Falha no autosave de cadastro", { error: String(error) });
    return respondWithError(error);
  }
}
