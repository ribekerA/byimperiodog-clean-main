/**
 * Hook de uso simples para carregar e salvar configs de Pixel/Analytics.
 * Usa a rota pública/administrativa /api/settings/tracking.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import type { PublicTrackingSettings } from "@/types/tracking";

export type TrackingFormValues = {
  facebookPixelId: string;
  googleAnalyticsId: string;
};

const initialValues: TrackingFormValues = {
  facebookPixelId: "",
  googleAnalyticsId: "",
};

export function useTrackingSettings() {
  const [values, setValues] = useState<TrackingFormValues>(initialValues);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/settings/tracking", { method: "GET", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar configurações");
      }
      const settings = data?.settings as PublicTrackingSettings | undefined;
      setValues({
        facebookPixelId: settings?.meta_pixel_id ?? "",
        googleAnalyticsId: settings?.ga4_id ?? "",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const pixel = values.facebookPixelId.trim();
    const ga = values.googleAnalyticsId.trim();

    if (/\s/.test(pixel)) {
      setSaving(false);
      setError("Facebook Pixel ID não pode conter espaços.");
      return;
    }
    if (pixel && !/^\d+$/.test(pixel)) {
      setSaving(false);
      setError("Facebook Pixel ID deve conter apenas números.");
      return;
    }
    if (ga && !ga.startsWith("G-")) {
      setSaving(false);
      setError('Google Analytics ID deve começar com "G-".');
      return;
    }

    try {
      const res = await fetch("/api/settings/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          facebookPixelId: pixel || null,
          googleAnalyticsId: ga || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar configurações");
      }

      setValues({
        facebookPixelId: data?.settings?.meta_pixel_id ?? "",
        googleAnalyticsId: data?.settings?.ga4_id ?? "",
      });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar configurações";
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [values]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    values,
    setValues,
    loading,
    saving,
    error,
    success,
    refetch,
    save,
  };
}
