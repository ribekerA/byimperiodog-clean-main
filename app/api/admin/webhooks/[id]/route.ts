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
import type { Webhook, UpdateWebhookPayload } from '@/types/webhooks';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .select('*')
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    const body: UpdateWebhookPayload = await request.json();

    // Validações
    if (body.url && !isValidUrl(body.url)) {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      );
    }

    if (body.events && body.events.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um evento' },
        { status: 400 }
      );
    }

    // Atualizar webhook
    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
