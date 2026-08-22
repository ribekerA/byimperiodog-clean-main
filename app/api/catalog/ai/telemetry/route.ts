import { NextResponse } from "next/server";
import { z } from "zod";

import { logCatalogAiEvent, type CatalogAiEvent } from "@/lib/ai/catalog-analytics";
import { rateLimitRequestMemory, tooManyRequests } from "@/lib/rateLimitDurable";
import { RequestBodyError, readJsonWithLimit } from "@/lib/requestGuards";

const eventSchema = z.object({
  eventType: z.enum(["reorder", "badge_click", "personalization", "seo_title", "seo_description"]),
  puppyId: z.string().trim().max(100).optional(),
  userSession: z.string().trim().max(200).optional(),
  badge: z.string().trim().max(100).optional(),
  oldPosition: z.number().int().nonnegative().max(10_000).optional(),
  newPosition: z.number().int().nonnegative().max(10_000).optional(),
  ctrBefore: z.number().finite().optional(),
  ctrAfter: z.number().finite().optional(),
  dwellBeforeMs: z.number().finite().nonnegative().max(86_400_000).optional(),
  dwellAfterMs: z.number().finite().nonnegative().max(86_400_000).optional(),
  personalized: z.boolean().optional(),
  clicked: z.boolean().optional(),
}).strict();

export async function POST(request: Request) {
  const rate = rateLimitRequestMemory(request, { scope: "catalog-telemetry", limit: 120, windowMs: 60_000 });
  if (!rate.allowed) return tooManyRequests(rate);

  try {
    const parsed = eventSchema.safeParse(await readJsonWithLimit(request, 8 * 1024));
    if (!parsed.success) return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
    const body: CatalogAiEvent = parsed.data;
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
    if (e instanceof RequestBodyError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
