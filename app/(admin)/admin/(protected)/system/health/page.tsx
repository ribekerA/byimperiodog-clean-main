"use client";

import { useEffect, useState } from "react";

import type { HealthData, Range } from "./SystemHealthUI";
import { SystemHealthUI } from "./SystemHealthUI";

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [range] = useState<Range>("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/system/health?range=${range}`, { cache: "no-store" });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.generatedAt) {
          throw new Error(result?.error || "Não foi possível carregar a saúde do sistema.");
        }
        if (active) setData(result as HealthData);
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [range, retry]);

  if (!data && loading) return <div role="status" className="p-6">Carregando saúde do sistema...</div>;
  if (!data && error) {
    return (
      <div className="p-6">
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p>Falha ao carregar os dados: {error}</p>
          <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-2 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return <SystemHealthUI initialData={data} initialRange={range} />;
}
