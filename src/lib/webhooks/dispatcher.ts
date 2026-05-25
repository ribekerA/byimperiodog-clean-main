/**
 * Dispatcher de Webhooks
 * By Império Dog - Sistema de envio de eventos para webhooks configurados
 */

import crypto from 'crypto';

import { createClient } from '@supabase/supabase-js';

import type { WebhookEvent, WebhookPayload, Webhook } from '@/types/webhooks';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface DispatchOptions {
  retries?: number;
  timeout?: number;
}

/**
 * Dispara evento para todos os webhooks que escutam este tipo de evento
 */
export async function dispatchWebhookEvent(
  event: WebhookEvent,
  data: Record<string, unknown>,
  metadata?: WebhookPayload['metadata'],
  options: DispatchOptions = {}
): Promise<void> {
  const { retries = 3, timeout = 10000 } = options;

  try {
    // Buscar webhooks ativos que escutam este evento
    const { data: webhooks, error } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('status', 'active')
      .contains('events', [event]);

    if (error) {
      console.error('Error fetching webhooks:', error);
      return;
    }

    if (!webhooks || webhooks.length === 0) {
      return; // Nenhum webhook configurado para este evento
    }

    // Criar payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };

    // Enviar para cada webhook (em paralelo)
    await Promise.all(
      webhooks.map((webhook) =>
        deliverWebhook(webhook as Webhook, payload, { retries, timeout })
      )
    );
  } catch (error) {
    console.error('Error dispatching webhook event:', error);
  }
}

/**
 * Entrega payload para um webhook específico
 */
async function deliverWebhook(
  webhook: Webhook,
  payload: WebhookPayload,
  options: Required<DispatchOptions>
): Promise<void> {
  let lastError: Error | null = null;
  let attempts = 0;

  for (let attempt = 0; attempt < options.retries; attempt++) {
    attempts++;

    try {
      const signature = generateSignature(
        JSON.stringify(payload),
        webhook.secret || ''
      );

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'User-Agent': 'ByImperioDog-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(options.timeout),
      });

      const responseBody = await response.text();

      // Registrar entrega
      await supabaseAdmin.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event: payload.event,
        payload,
        status: response.ok ? 'success' : 'failed',
        response_status: response.status,
        response_body: responseBody.substring(0, 1000),
        attempts,
        delivered_at: new Date().toISOString(),
      });

      if (response.ok) {
        // Sucesso - atualizar contadores
        await supabaseAdmin
          .from('webhooks')
          .update({
            success_count: webhook.success_count + 1,
            last_triggered_at: new Date().toISOString(),
          })
          .eq('id', webhook.id);

        return; // Entregue com sucesso
      } else {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Esperar antes de tentar novamente (backoff exponencial)
    if (attempt < options.retries - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  // Todas as tentativas falharam
  await supabaseAdmin.from('webhook_deliveries').insert({
    webhook_id: webhook.id,
    event: payload.event,
    payload,
    status: 'failed',
    response_body: lastError?.message || 'Unknown error',
    attempts,
  });

  await supabaseAdmin
    .from('webhooks')
    .update({
      error_count: webhook.error_count + 1,
    })
    .eq('id', webhook.id);

  // Se muitos erros consecutivos, desabilitar webhook
  if (webhook.error_count + 1 >= 10) {
    await supabaseAdmin
      .from('webhooks')
      .update({ status: 'error' })
      .eq('id', webhook.id);
  }
}

function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Exemplos de uso
 */

// Exemplo 1: Lead de formulário
export async function notifyLeadFormSubmit(formData: {
  name: string;
  email: string;
  phone: string;
  message?: string;
}) {
  await dispatchWebhookEvent('lead_form_submit', formData, {
    page_url: formData.message || 'unknown',
  });
}

// Exemplo 2: Reserva de filhote
export async function notifyPuppyReservation(reservationData: {
  puppy_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
}) {
  await dispatchWebhookEvent('puppy_reservation', reservationData);
}

// Exemplo 3: Clique no WhatsApp
export async function notifyWhatsAppClick(data: {
  phone: string;
  page_url: string;
}) {
  await dispatchWebhookEvent('whatsapp_click', data, {
    page_url: data.page_url,
  });
}
