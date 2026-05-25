/**
 * Página Admin - Webhooks
 * By Império Dog - Gerenciamento de Webhooks
 */

'use client';

import { useState, useEffect } from 'react';

import type { Webhook, WebhookEvent } from '@/types/webhooks';

const EVENT_LABELS: Record<WebhookEvent, string> = {
  lead_form_submit: 'Formulário de Lead',
  puppy_reservation: 'Reserva de Filhote',
  contact_form: 'Formulário de Contato',
  whatsapp_click: 'Clique no WhatsApp',
  phone_click: 'Clique no Telefone',
  purchase: 'Compra Realizada',
  page_view: 'Visualização de Página',
  test_event: 'Evento de Teste',
};

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as WebhookEvent[],
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      const response = await fetch('/api/admin/webhooks');
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Webhook criado com sucesso!');
        setShowCreateForm(false);
        setFormData({ name: '', url: '', events: [] });
        fetchWebhooks();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Erro ao criar webhook');
    }
  }

  async function handleTest(id: string) {
    try {
      const response = await fetch(`/api/admin/webhooks/${id}/test`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}\nTempo: ${result.response_time_ms}ms`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      alert('Erro ao testar webhook');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente remover este webhook?')) return;

    try {
      const response = await fetch(`/api/admin/webhooks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Webhook removido com sucesso!');
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Error deleting webhook:', error);
      alert('Erro ao remover webhook');
    }
  }

  function toggleEvent(event: WebhookEvent) {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Webhooks</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancelar' : '+ Novo Webhook'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Criar Novo Webhook</h2>

          <div className="mb-4">
            <label htmlFor="name" className="block font-medium mb-2">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="url" className="block font-medium mb-2">
              URL
            </label>
            <input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="https://example.com/webhook"
              required
            />
          </div>

          <div className="mb-4">
            <span className="block font-medium mb-2">Eventos</span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(EVENT_LABELS).map(([event, label]) => (
                <label key={event} htmlFor={`event-${event}`} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event as WebhookEvent)}
                    onChange={() => toggleEvent(event as WebhookEvent)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Criar Webhook
          </button>
        </form>
      )}

      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            Nenhum webhook configurado
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{webhook.name}</h3>
                  <p className="text-sm text-gray-600">{webhook.url}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm ${
                    webhook.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : webhook.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {webhook.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Eventos:</p>
                <div className="flex flex-wrap gap-2">
                  {webhook.events.map((event) => (
                    <span
                      key={event}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {EVENT_LABELS[event]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Sucessos</p>
                  <p className="font-semibold text-green-600">{webhook.success_count}</p>
                </div>
                <div>
                  <p className="text-gray-600">Erros</p>
                  <p className="font-semibold text-red-600">{webhook.error_count}</p>
                </div>
                <div>
                  <p className="text-gray-600">Último disparo</p>
                  <p className="font-semibold">
                    {webhook.last_triggered_at
                      ? new Date(webhook.last_triggered_at).toLocaleDateString()
                      : 'Nunca'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleTest(webhook.id)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Testar
                </button>
                <button
                  onClick={() => handleDelete(webhook.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
