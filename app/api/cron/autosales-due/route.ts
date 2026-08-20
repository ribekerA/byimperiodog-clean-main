export const dynamic = "force-dynamic";

/**
 * GET|POST /api/cron/autosales-due
 *
 * Roda a fila de follow-up dos leads. Ate aqui ela so existia no papel:
 * /api/leads cria a sequencia em `autosales_sequences` a cada lead novo, mas
 * quem processava era `npm run autosales:worker`, um script que precisa de
 * alguem com o terminal aberto. Em producao ninguem rodava — as sequencias
 * ficavam paradas em `status = scheduled` para sempre.
 *
 * O que este endpoint faz NAO e mandar mensagem para o lead. processAutoSalesQueue
 * -> executeAutoSalesStep escreve a mensagem pronta em `autosales_logs` com
 * `status = "queued"` e adianta a sequencia para o proximo passo. Quem envia
 * continua sendo a responsavel, olhando a fila em /admin/autosales. Nenhuma
 * mensagem sai do site sozinha.
 *
 * Autenticacao: CRON_SECRET (ver src/lib/cron/auth.ts).
 */

import { NextResponse } from "next/server";

import { processAutoSalesQueue } from "@/lib/ai/autoSalesEngine";
import { autorizarCron } from "@/lib/cron/auth";
import { createLogger } from "@/lib/logger";
import { hasServiceRoleKey } from "@/lib/supabaseAdmin";

const logger = createLogger("cron:autosales-due");

async function executar(req: Request) {
  const negado = autorizarCron(req);
  if (negado) return negado;

  if (!hasServiceRoleKey()) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY ausente" },
      { status: 500 }
    );
  }

  try {
    const processed = await processAutoSalesQueue();
    if (processed > 0) logger.info("autosales_fila_processada", { processed });
    return NextResponse.json({ ok: true, processed });
  } catch (error) {
    // A fila nao pode derrubar o agendador: o proximo ciclo tenta de novo, e as
    // sequencias com defeito ficam registradas no log de cada passo.
    logger.error("autosales_fila_falhou", { error: String(error) });
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return executar(req);
}

export async function POST(req: Request) {
  return executar(req);
}
