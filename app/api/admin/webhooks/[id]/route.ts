export const dynamic = "force-dynamic";
/**
 * API Admin - Webhooks [ID]
 * By Império Dog - Gerenciamento Individual de Webhooks
 *
 * GET /api/admin/webhooks/[id] - Busca webhook específico
 * PATCH /api/admin/webhooks/[id] - Atualiza webhook
 * DELETE /api/admin/webhooks/[id] - Remove webhook
 * POST /api/admin/webhooks/[id]/test - Testa webhook
 */

import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import { validatePublicHttpsUrl } from '@/lib/safeOutboundUrl';
import type { Webhook, UpdateWebhookPayload } from '@/types/webhooks';

const ALLOWED_EVENTS = new Set([
  'lead_form_submit', 'puppy_reservation', 'contact_form', 'whatsapp_click',
  'phone_click', 'purchase', 'page_view', 'test_event',
]);
const ALLOWED_STATUS = new Set(['active', 'inactive', 'error']);

// Guard: createClient throws if URL is empty — during `next build` env vars are
// not available, so we skip construction and let handlers fail gracefully at runtime.
const supabaseAdmin = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    )
  : (null as any);

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .select('id,name,url,events,status,created_at,updated_at,last_triggered_at,error_count,success_count')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ webhook: data as Webhook });
  } catch (error) {
    console.error('Error in GET /api/admin/webhooks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    const contentLength = Number(request.headers.get('content-length') || '0');
    if (Number.isFinite(contentLength) && contentLength > 16_384) {
      return NextResponse.json({ error: 'Payload grande demais' }, { status: 413 });
    }
    const body: UpdateWebhookPayload = await request.json();

    // Validações
    let safeUrl: string | undefined;
    if (body.url) {
      try { safeUrl = await validatePublicHttpsUrl(body.url); }
      catch { return NextResponse.json({ error: 'Use uma URL HTTPS pública válida' }, { status: 400 }); }
    }

    if (body.events && (body.events.length === 0 || body.events.length > ALLOWED_EVENTS.size || body.events.some((event) => !ALLOWED_EVENTS.has(event)))) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um evento' },
        { status: 400 }
      );
    }
    if (body.status && !ALLOWED_STATUS.has(body.status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    // Atualizar webhook
    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .update({
        ...(typeof body.name === 'string' ? { name: body.name.trim().slice(0, 120) } : {}),
        ...(safeUrl ? { url: safeUrl } : {}),
        ...(body.events ? { events: body.events } : {}),
        ...(body.status ? { status: body.status } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select('id,name,url,events,status,created_at,updated_at,last_triggered_at,error_count,success_count')
      .single();

    if (error) {
      console.error('Error updating webhook:', error);
      return NextResponse.json(
        { error: 'Failed to update webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      webhook: data as Webhook,
      message: 'Webhook atualizado com sucesso',
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/webhooks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { error } = await supabaseAdmin
      .from('webhooks')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting webhook:', error);
      return NextResponse.json(
        { error: 'Failed to delete webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Webhook removido com sucesso',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/webhooks/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
