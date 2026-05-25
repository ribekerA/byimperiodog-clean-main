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
import type { Webhook, CreateWebhookPayload } from '@/types/webhooks';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

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
      .select('*')
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

    const body: CreateWebhookPayload = await request.json();

    // Validações
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.url || !isValidUrl(body.url)) {
      return NextResponse.json(
        { error: 'URL inválida' },
        { status: 400 }
      );
    }

    if (!body.events || body.events.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um evento' },
        { status: 400 }
      );
    }

    // Gerar secret se não fornecido
    const secret = body.secret || generateWebhookSecret();

    // Criar webhook
    const { data, error } = await supabaseAdmin
      .from('webhooks')
      .insert({
        name: body.name,
        url: body.url,
        events: body.events,
        secret,
        status: 'active',
        error_count: 0,
        success_count: 0,
      })
      .select()
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

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
