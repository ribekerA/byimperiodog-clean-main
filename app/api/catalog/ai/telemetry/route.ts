import { NextResponse } from "next/server";

import { logCatalogAiEvent, type CatalogAiEvent } from "@/lib/ai/catalog-analytics";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CatalogAiEvent>;
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
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
