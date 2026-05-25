import { supabaseAdmin } from "@/lib/supabaseAdmin";

type EventType = "reorder" | "badge_click" | "personalization" | "seo_title" | "seo_description";

export type CatalogAiEvent = {
  eventType: EventType;
  puppyId?: string;
  userSession?: string;
  badge?: string;
  oldPosition?: number;
  newPosition?: number;
  ctrBefore?: number;
  ctrAfter?: number;
  dwellBeforeMs?: number;
  dwellAfterMs?: number;
  personalized?: boolean;
  clicked?: boolean;
};

export async function logCatalogAiEvent(payload: CatalogAiEvent) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("catalog_ai_events").insert({
    event_type: payload.eventType,
    puppy_id: payload.puppyId ?? null,
    user_session: payload.userSession ?? null,
    badge: payload.badge ?? null,
    old_position: payload.oldPosition ?? null,
    new_position: payload.newPosition ?? null,
    ctr_before: payload.ctrBefore ?? null,
    ctr_after: payload.ctrAfter ?? null,
    dwell_before_ms: payload.dwellBeforeMs ?? null,
    dwell_after_ms: payload.dwellAfterMs ?? null,
    personalized: payload.personalized ?? null,
    clicked: payload.clicked ?? null,
  });
  if (error) throw new Error(error.message);
}

export type CatalogAiMetrics = {
  eventType: EventType;
  total: number;
  avgCtrDelta: number | null;
  avgDwellDelta: number | null;
};

export async function getCatalogAiMetrics(): Promise<CatalogAiMetrics[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("catalog_ai_metrics").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    eventType: row.event_type as EventType,
    total: Number(row.total) || 0,
    avgCtrDelta: row.avg_ctr_delta !== null ? Number(row.avg_ctr_delta) : null,
    avgDwellDelta: row.avg_dwell_delta !== null ? Number(row.avg_dwell_delta) : null,
  }));
}
