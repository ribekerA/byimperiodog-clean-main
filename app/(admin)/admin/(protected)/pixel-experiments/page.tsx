/**
 * Página Admin - A/B Testing de Pixels
 * By Império Dog - Experimentos com diferentes configurações
 */

'use client';

import { useState, useEffect } from 'react';
import type { Experiment } from '@/types/experiments';

export default function PixelExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchExperiments();
  }, []);

  async function fetchExperiments() {
    try {
      const response = await fetch('/api/admin/pixel-experiments');
      const data = await response.json();
      setExperiments(data.experiments || []);
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartExperiment(id: string) {
    if (!confirm('Iniciar este experimento?')) return;

    try {
      const response = await fetch(`/api/admin/pixel-experiments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'running' }),
      });

      if (response.ok) {
        alert('Experimento iniciado!');
        fetchExperiments();
      }
    } catch (error) {
      console.error('Error starting experiment:', error);
    }
  }

  async function handleStopExperiment(id: string) {
    if (!confirm('Pausar este experimento?')) return;

    try {
      const response = await fetch(`/api/admin/pixel-experiments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paused' }),
      });

      if (response.ok) {
        alert('Experimento pausado!');
        fetchExperiments();
      }
    } catch (error) {
      console.error('Error pausing experiment:', error);
    }
  }

  async function handleCompleteExperiment(id: string) {
    if (!confirm('Finalizar este experimento?')) return;

    try {
      const response = await fetch(`/api/admin/pixel-experiments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (response.ok) {
        alert('Experimento finalizado! Veja os resultados.');
        fetchExperiments();
      }
    } catch (error) {
      console.error('Error completing experiment:', error);
    }
  }

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">A/B Testing de Pixels</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancelar' : '+ Novo Experimento'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Criar Novo Experimento
          </h2>
          <p className="text-gray-600 mb-4">
            Formulário de criação será implementado em breve.
          </p>
          <p className="text-sm text-gray-500">
            Configure diferentes pixels para teste A/B e compare métricas de
            conversão.
          </p>
        </div>
      )}

      <div className="grid gap-6">
        {experiments.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500 mb-4">
              Nenhum experimento criado ainda
            </p>
            <p className="text-sm text-gray-400">
              Crie experimentos para testar diferentes configurações de pixels
              e descobrir qual gera mais conversões.
            </p>
          </div>
        ) : (
          experiments.map((exp) => (
            <div key={exp.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{exp.name}</h3>
                  {exp.description && (
                    <p className="text-gray-600 mt-1">{exp.description}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    exp.status === 'running'
                      ? 'bg-green-100 text-green-800'
                      : exp.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : exp.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {exp.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="border rounded p-3">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Variante de Controle
                  </p>
                  <p className="font-semibold">
                    {exp.control_variant?.name || 'N/A'}
                  </p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Variante de Teste
                  </p>
                  <p className="font-semibold">
                    {exp.test_variant?.name || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <p>
                  <strong>% de tráfego:</strong> {exp.traffic_split}%
                </p>
                {exp.start_date && (
                  <p>
                    <strong>Início:</strong>{' '}
                    {new Date(exp.start_date).toLocaleDateString()}
                  </p>
                )}
                {exp.end_date && (
                  <p>
                    <strong>Fim:</strong>{' '}
                    {new Date(exp.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {exp.status === 'draft' && (
                  <button
                    onClick={() => handleStartExperiment(exp.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Iniciar
                  </button>
                )}
                {exp.status === 'running' && (
                  <>
                    <button
                      onClick={() => handleStopExperiment(exp.id)}
                      className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                    >
                      Pausar
                    </button>
                    <button
                      onClick={() => handleCompleteExperiment(exp.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Finalizar
                    </button>
                  </>
                )}
                {exp.status === 'paused' && (
                  <button
                    onClick={() => handleStartExperiment(exp.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Retomar
                  </button>
                )}
                {exp.status === 'completed' && (
                  <a
                    href={`/admin/pixel-experiments/${exp.id}/results`}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Ver Resultados
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
