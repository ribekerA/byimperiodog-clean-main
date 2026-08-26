import { NextResponse } from "next/server";

import { logCatalogAiEvent, type CatalogAiEvent } from "@/lib/ai/catalog-analytics";
import { erroPublico } from "@/lib/apiErro";
import { corpoJson, limiteDeTaxa } from "@/lib/limitePublico";

export async function POST(request: Request) {
  // Telemetria de catálogo é escrita pública. O evento é pequeno; 120 por
  // minuto cobre uma sessão de navegação intensa.
  const bloqueio = limiteDeTaxa(request, "catalog-telemetry", 120);
  if (bloqueio) return bloqueio;

  const lido = await corpoJson<Partial<CatalogAiEvent>>(request, 4 * 1024);
  if (lido.resposta) return lido.resposta;
  const body = lido.dados;

  try {
    if (!body.eventType) {
      return NextResponse.json({ error: "eventType é obrigatório" }, { status: 400 });
    }
    await logCatalogAiEvent({
      eventType: body.eventType,
      puppyId: body.puppyId,
      userSession: body.userSession,
      badge: body.badge,
      oldPosition: body.oldPosition,
      newPosition: body.newPosition,
      ctrBefore: body.ctrBefore,
      ctrAfter: body.ctrAfter,
      dwellBeforeMs: body.dwellBeforeMs,
      dwellAfterMs: body.dwellAfterMs,
      personalized: body.personalized,
      clicked: body.clicked,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erroPublico("api/catalog/ai/telemetry", e);
  }
}
