/**
 * Tipos para Sistema de Webhooks
 * By Império Dog - Sistema de Notificações de Conversões
 */

export type WebhookEvent = 
  | 'lead_form_submit'
  | 'puppy_reservation'
  | 'contact_form'
  | 'whatsapp_click'
  | 'phone_click'
  | 'purchase'
  | 'page_view'
  | 'test_event';

export type WebhookStatus = 'active' | 'inactive' | 'error';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  status: WebhookStatus;
  secret?: string;
  created_at: string;
  updated_at: string;
  last_triggered_at?: string;
  error_count: number;
  success_count: number;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
  metadata?: {
    user_agent?: string;
    ip?: string;
    page_url?: string;
    referrer?: string;
  };
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: WebhookEvent;
  payload: WebhookPayload;
  status: 'pending' | 'success' | 'failed';
  response_status?: number;
  response_body?: string;
  attempts: number;
  created_at: string;
  delivered_at?: string;
}

export interface CreateWebhookPayload {
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
}

export interface UpdateWebhookPayload {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  status?: WebhookStatus;
  secret?: string;
}

export interface WebhookTestResult {
  success: boolean;
  status?: number;
  message: string;
  response_time_ms?: number;
}

export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  lead_form_submit: 'Formulário de Lead',
  puppy_reservation: 'Reserva de Filhote',
  contact_form: 'Formulário de Contato',
  whatsapp_click: 'Clique no WhatsApp',
  phone_click: 'Clique no Telefone',
  purchase: 'Compra Realizada',
  page_view: 'Visualização de Página',
  test_event: 'Evento de Teste',
};
