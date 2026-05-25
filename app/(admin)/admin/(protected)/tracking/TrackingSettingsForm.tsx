"use client";

import { useEffect, useState, FormEvent } from "react";
import { Loader2, Save } from "lucide-react";

import type { PublicTrackingSettings } from "@/types/tracking";

const FIELDS: Array<{ key: keyof PublicTrackingSettings; label: string; placeholder: string }> = [
  { key: "gtm_id", label: "Google Tag Manager", placeholder: "GTM-XXXXXXX" },
  { key: "ga4_id", label: "Google Analytics 4", placeholder: "G-XXXXXXX" },
  { key: "meta_pixel_id", label: "Meta / Facebook Pixel", placeholder: "123456789012345" },
  { key: "tiktok_pixel_id", label: "TikTok Pixel", placeholder: "TT-XXXXXX" },
  { key: "pinterest_tag_id", label: "Pinterest Tag", placeholder: "123456" },
  { key: "hotjar_id", label: "Hotjar", placeholder: "HJ-XXXXXX" },
  { key: "clarity_id", label: "Microsoft Clarity", placeholder: "XXXXXXXX" },
];

export function TrackingSettingsForm() {
  const [values, setValues] = useState<Partial<PublicTrackingSettings>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/settings", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha ao carregar configurações");
        const json = await res.json();
        setValues(json.settings || {});
      } catch (err) {
        setError((err as Error)?.message ?? "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = Object.fromEntries(
        FIELDS.map(({ key }) => [key, (values[key]?.toString().trim() || null) as string | null])
      );
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erro ao salvar");
      }
      setMessage("IDs atualizados e prontos para uso no site.");
    } catch (err) {
      setError((err as Error)?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1">
            <label className="text-sm font-semibold text-zinc-800" htmlFor={key}>
              {label}
            </label>
            <input
              id={key}
              name={key}
              value={typeof values[key] === "string" ? values[key] : ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">Salve para publicar os IDs no site e injetar as tags.</p>
        <button
          type="submit"
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {saving ? "Salvando..." : "Salvar IDs"}
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
