export const dynamic = "force-dynamic";
/**
 * API Admin - Webhooks
 * By Império Dog - Gerenciamento de Webhooks
 *
 * GET /api/admin/webhooks - Lista todos os webhooks
 * POST /api/admin/webhooks - Cria um novo webhook
 */

import crypto from 'crypto';

import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import { validatePublicHttpsUrl } from '@/lib/safeOutboundUrl';
import type { Webhook, CreateWebhookPayload } from '@/types/webhooks';

const ALLOWED_EVENTS = new Set([
  'lead_form_submit', 'puppy_reservation', 'contact_form', 'whatsapp_click',
  'phone_click', 'purchase', 'page_view', 'test_event',
]);

// Guard: createClient throws if URL is empty — during `next build` env vars are
// not available, so we skip construction and let handlers fail gracefully at runtime.
const supabaseAdmin = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    )
  : (null as any);

export async function GET(request: NextRequest) {
  try {
    // Requer autenticação admin
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    // Buscar webhooks do banco
    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .select('id,name,url,events,status,created_at,updated_at,last_triggered_at,error_count,success_count')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch webhooks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      webhooks: data as Webhook[],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Requer autenticação admin
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    const contentLength = Number(request.headers.get('content-length') || '0');
    if (Number.isFinite(contentLength) && contentLength > 16_384) {
      return NextResponse.json({ error: 'Payload grande demais' }, { status: 413 });
    }
    const body: CreateWebhookPayload = await request.json();

    // Validações
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    let safeUrl: string;
    try {
      safeUrl = await validatePublicHttpsUrl(body.url || '');
    } catch {
      return NextResponse.json(
        { error: 'Use uma URL HTTPS pública válida' },
        { status: 400 }
      );
    }

    if (!body.events || body.events.length === 0 || body.events.length > ALLOWED_EVENTS.size || body.events.some((event) => !ALLOWED_EVENTS.has(event))) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um evento' },
        { status: 400 }
      );
    }

    // Gerar secret se não fornecido
    const secret = generateWebhookSecret();

    // Criar webhook
    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .insert({
        name: body.name.trim().slice(0, 120),
        url: safeUrl,
        events: body.events,
        secret,
        status: 'active',
        error_count: 0,
        success_count: 0,
      })
      .select('id,name,url,events,status,created_at,updated_at,last_triggered_at,error_count,success_count')
      .single();

    if (error) {
      console.error('Error creating webhook:', error);
      return NextResponse.json(
        { error: 'Failed to create webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      webhook: data as Webhook,
      message: 'Webhook criado com sucesso',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
