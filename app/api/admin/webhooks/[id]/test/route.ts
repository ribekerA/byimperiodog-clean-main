export const dynamic = "force-dynamic";
/**
 * API Admin - Testar Webhook
 * By Império Dog - Endpoint para testar entrega de webhook
 * 
 * POST /api/admin/webhooks/[id]/test - Envia evento de teste
 */

import crypto from 'crypto';

import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAuth';
import type { WebhookTestResult, WebhookPayload } from '@/types/webhooks';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    // Buscar webhook
    const { data: webhook, error } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !webhook) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      );
    }

    // Criar payload de teste
    const payload: WebhookPayload = {
      event: 'test_event',
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'Este é um evento de teste do By Império Dog',
        webhook_id: webhook.id,
        webhook_name: webhook.name,
      },
      metadata: {
        user_agent: request.headers.get('user-agent') || undefined,
        page_url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/webhooks`,
      },
    };

    // Enviar webhook
    const startTime = Date.now();
    
    try {
      const signature = generateSignature(JSON.stringify(payload), webhook.secret);
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'test_event',
          'User-Agent': 'ByImperioDog-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();

      // Registrar entrega
      await supabaseAdmin.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event: 'test_event',
        payload,
        status: response.ok ? 'success' : 'failed',
        response_status: response.status,
        response_body: responseBody.substring(0, 1000), // Limitar tamanho
        attempts: 1,
        delivered_at: new Date().toISOString(),
      });

      // Atualizar contadores
      if (response.ok) {
        await supabaseAdmin
          .from('webhooks')
          .update({
            success_count: webhook.success_count + 1,
            last_triggered_at: new Date().toISOString(),
          })
          .eq('id', webhook.id);
      } else {
        await supabaseAdmin
          .from('webhooks')
          .update({
            error_count: webhook.error_count + 1,
          })
          .eq('id', webhook.id);
      }

      const result: WebhookTestResult = {
        success: response.ok,
        status: response.status,
        message: response.ok 
          ? `Webhook testado com sucesso (${response.status})` 
          : `Erro ao testar webhook: ${response.statusText}`,
        response_time_ms: responseTime,
      };

      return NextResponse.json(result);
    } catch (fetchError: unknown) {
      // Erro de rede ou timeout
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      await supabaseAdmin.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event: 'test_event',
        payload,
        status: 'failed',
        response_body: errorMessage,
        attempts: 1,
      });

      await supabaseAdmin
        .from('webhooks')
        .update({
          error_count: webhook.error_count + 1,
        })
        .eq('id', webhook.id);

      const result: WebhookTestResult = {
        success: false,
        message: `Erro ao conectar: ${errorMessage}`,
      };

      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/admin/webhooks/[id]/test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}
