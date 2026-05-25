export const dynamic = "force-dynamic";
import { NextResponse, type NextRequest } from 'next/server';

import { supabaseAdmin, hasServiceRoleKey } from '@/lib/supabaseAdmin';


// Endpoint leve de coleta de métricas. Objetivos:
// - Nunca derrubar UX se a tabela ainda não existe ou se a key não está configurada.
// - Permitir desligar via env (DISABLE_ANALYTICS=1).
// - Validar input mínimo.
// - Devolver 202 em casos onde decidimos ignorar (sem persistência) para evitar spam de erros 500 no log.
export async function POST(req: NextRequest) {
  // Short‑circuit se desativado por configuração
  if (process.env.DISABLE_ANALYTICS === '1') {
    return NextResponse.json({ disabled: true }, { status: 202 });
  }
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  interface BodyShape { name?: unknown; value?: unknown; id?: unknown; label?: unknown; meta?: unknown; path?: unknown; ts?: unknown }
  const b = (body && typeof body === 'object' ? body : {}) as BodyShape;
  const name = typeof b.name === 'string' ? b.name : undefined;
  const value = typeof b.value === 'number' ? b.value : undefined;
  const id = typeof b.id === 'string' ? b.id : undefined;
  const label = typeof b.label === 'string' ? b.label : undefined;
  const meta = b.meta as unknown;
  const path = typeof b.path === 'string' ? b.path : undefined;
  const ts = typeof b.ts === 'string' || b.ts instanceof Date ? b.ts : undefined;
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'name required' }, { status: 400 });
  }

  const ua = req.headers.get('user-agent') || null;
  const forwarded = req.headers.get('x-forwarded-for');
  // Casting mínimo seguro: request ip não é tipada oficialmente
  const ip = forwarded?.split(',')[0]?.trim() || (req as unknown as { ip?: string }).ip || null;

  // Monta payload (campos opcionais normalizados)
  interface AnalyticsInsertPayload {
    name: string;
    value: number | null;
    metric_id: string | null;
    label: string | null;
    meta: unknown | null;
    path: string | null;
    ua: string | null;
    ip: string | null;
    ts: string;
    created_at: string;
  }
  const payload: AnalyticsInsertPayload = {
    name,
    value: typeof value === 'number' ? value : null,
    metric_id: id ?? null,
    label: label ?? null,
    meta: meta ?? null,
    path: path ?? null,
    ua,
    ip,
    ts: ts ? new Date(ts).toISOString() : new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  // Tentativa de persistência; se ambiente não configurado ou tabela ausente, devolve 202 silencioso.
  try {
  let sb: ReturnType<typeof supabaseAdmin>;
    try {
      sb = supabaseAdmin();
    } catch (e: unknown) {
      return NextResponse.json({ skipped: 'supabase_admin_unavailable' }, { status: 202 });
    }

  let insertError: unknown = null;
  let insertedId: string | null = null;
    try {
      const { data, error } = await sb
        .from('analytics_events')
        .insert(payload)
        .select('id')
        .single();
      insertError = error;
      insertedId = data?.id || null;
    } catch (err: unknown) {
      insertError = err;
    }
    if (insertError) {
      const error = insertError as Partial<Error> & { code?: string };
      const msg = (error?.message || '').toLowerCase();
      console.error('[analytics.insert.error]', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack?.split('\n').slice(0, 4).join(' | '),
        originalPayload: { name: payload.name, path: payload.path }
      });
      if (msg.includes('fetch failed') || msg.includes('enotfound') || msg.includes('getaddrinfo')) {
        return NextResponse.json({ skipped: 'network_unreachable' }, { status: 202 });
      }
      if (error?.message === 'supabase_offline_stub') {
        return NextResponse.json({ skipped: 'offline_stub' }, { status: 202 });
      }
      const code = error?.code;
      if (code === '42P01' || code === '42501') {
        return NextResponse.json({ skipped: 'table_missing_or_rls', code }, { status: 202 });
      }
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ skipped: 'dev_other_error', code, message: error?.message }, { status: 202 });
      }
      return NextResponse.json({ error: error.message || 'insert_failed', code, offline: msg.includes('getaddrinfo') ? true : undefined }, { status: 500 });
    }

    // Outbox opcional (persistir payload bruto para processamento assíncrono) controlado via ANALYTICS_OUTBOX=1
    if (insertedId && process.env.ANALYTICS_OUTBOX === '1') {
      try {
        // Remover campos potencialmente sensíveis (ip) do payload replicado
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ip: _omitIp, ...clean } = payload as Omit<AnalyticsInsertPayload, 'ip'> & { ip: string | null };
        await sb
          .from('analytics_events_outbox')
          .insert({ analytics_event_id: insertedId, payload: clean });
      } catch (outboxErr: unknown) {
        const oe = outboxErr as Partial<Error> & { code?: string };
        const code = oe.code;
        if (code === '42P01') {
          // tabela inexistente — silencia
        } else if (process.env.NODE_ENV !== 'production') {
          console.warn('[analytics.outbox.skip]', oe?.message || oe);
        }
      }
    }

    return NextResponse.json({ ok: true, id: insertedId });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// GET agregador simples: requer x-admin-token
export async function GET(req: NextRequest) {
  const tokenHeader = req.headers.get('x-admin-token');
  const adminToken = process.env.ADMIN_TOKEN || process.env.DEBUG_TOKEN;
  if (!adminToken || tokenHeader !== adminToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const windowParam = (searchParams.get('window') || '24h').toLowerCase();
  let hours = 24;
  if (windowParam.endsWith('h')) {
    const n = parseInt(windowParam.slice(0, -1), 10);
    if (!isNaN(n) && n > 0 && n <= 24 * 14) hours = n;
  } else if (windowParam.endsWith('d')) {
    const n = parseInt(windowParam.slice(0, -1), 10);
    if (!isNaN(n) && n > 0 && n <= 14) hours = n * 24;
  }
  const sinceIso = new Date(Date.now() - hours * 3600_000).toISOString();

  if (!hasServiceRoleKey()) {
    return NextResponse.json({ ok: true, stub: true, events: [] });
  }

  let sb;
  try { sb = supabaseAdmin(); } catch {
    return NextResponse.json({ ok: true, stub: true, events: [] });
  }
  try {
    const { data, error } = await sb
      .from('analytics_events')
      .select('name,value,ts')
      .gte('ts', sinceIso)
      .limit(10_000);
    if (error) {
  const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return NextResponse.json({ ok: true, stub: true, events: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const agg: Record<string, { count: number; sum: number | null; last_ts: string }> = {};
    interface Row { name: string; value: number | null; ts: string }
    for (const row of (data || []) as Row[]) {
      const r = row;
      if (!agg[r.name]) {
        agg[r.name] = { count: 0, sum: r.value != null ? 0 : null, last_ts: r.ts };
      }
      agg[r.name].count += 1;
      if (agg[r.name].sum != null && r.value != null) agg[r.name].sum! += Number(r.value);
      if (r.ts > agg[r.name].last_ts) agg[r.name].last_ts = r.ts;
    }
    const events = Object.entries(agg).map(([eventName, v]) => ({ name: eventName, count: v.count, sum: v.sum, last_ts: v.last_ts }));
    events.sort((a, b) => b.count - a.count);
    return NextResponse.json({ ok: true, window_hours: hours, events });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
