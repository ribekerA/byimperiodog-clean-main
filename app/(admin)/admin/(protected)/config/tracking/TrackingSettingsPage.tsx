"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Copy,
  History,
  Info,
  Loader2,
  Power,
  RefreshCw,
  ShieldCheck,
  Tag,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/ui/toast";
import type { TrackingConfig } from "@/lib/tracking/getTrackingConfig";

// ─── Constants ────────────────────────────────────────────────────────────────

const ENV_OPTIONS = [
  { value: "production", label: "Produção" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
] as const;

type Environment = (typeof ENV_OPTIONS)[number]["value"];
type TabId = "pixels" | "domain" | "history";

type TrackingFormState = {
  isGTMEnabled: boolean;
  gtmContainerId: string;
  isGAEnabled: boolean;
  gaMeasurementId: string;
  isFacebookEnabled: boolean;
  facebookPixelId: string;
  isTikTokEnabled: boolean;
  tiktokPixelId: string;
  metaDomainVerification: string;
  googleSiteVerification: string;
  // Extended platforms
  googleAdsId: string;
  hotjarId: string;
  clarityId: string;
  pinterestId: string;
};

type FieldKey = keyof TrackingFormState;
type ToggleKey = "isGTMEnabled" | "isGAEnabled" | "isFacebookEnabled" | "isTikTokEnabled";

// ─── Pixel field definitions ──────────────────────────────────────────────────

type PixelField = {
  id: string;
  label: string;
  description: string;
  toggleKey: ToggleKey;
  inputKey: Exclude<FieldKey, ToggleKey>;
  placeholder: string;
  pattern: RegExp | null;
  hint: string;
};

const PIXEL_FIELDS: PixelField[] = [
  {
    id: "gtm",
    label: "Google Tag Manager",
    description: "Centraliza todos os scripts sem deploy.",
    toggleKey: "isGTMEnabled",
    inputKey: "gtmContainerId",
    placeholder: "GTM-XXXXXXX",
    pattern: /^GTM-[A-Z0-9]+$/i,
    hint: "Formato: GTM-XXXXXXX",
  },
  {
    id: "ga4",
    label: "Google Analytics 4",
    description: "Mede tráfego e funil de conversão.",
    toggleKey: "isGAEnabled",
    inputKey: "gaMeasurementId",
    placeholder: "G-XXXXXXXXXX",
    pattern: /^G-[A-Z0-9]+$/i,
    hint: "Formato: G-XXXXXXXXXX",
  },
  {
    id: "facebook",
    label: "Meta / Facebook Pixel",
    description: "Remarketing e conversões no Ads Manager.",
    toggleKey: "isFacebookEnabled",
    inputKey: "facebookPixelId",
    placeholder: "1234567890",
    pattern: /^[0-9]{5,}$/,
    hint: "Somente números (10–20 dígitos)",
  },
  {
    id: "tiktok",
    label: "TikTok Pixel",
    description: "Eventos para campanhas TikTok Ads.",
    toggleKey: "isTikTokEnabled",
    inputKey: "tiktokPixelId",
    placeholder: "C4A3XXXXXXXXXX",
    pattern: /^(TT-)?[A-Z0-9]{6,}$/i,
    hint: "Código alfanumérico do TikTok Events Manager",
  },
];

type SimplePixelField = {
  id: string;
  label: string;
  description: string;
  inputKey: "googleAdsId" | "hotjarId" | "clarityId" | "pinterestId";
  placeholder: string;
  pattern: RegExp | null;
  hint: string;
};

const EXTENDED_FIELDS: SimplePixelField[] = [
  {
    id: "google-ads",
    label: "Google Ads",
    description: "Conversões e remarketing via Google Ads.",
    inputKey: "googleAdsId",
    placeholder: "AW-123456789",
    pattern: /^AW-[0-9]+$/i,
    hint: "Formato: AW-XXXXXXXXX",
  },
  {
    id: "hotjar",
    label: "Hotjar",
    description: "Heatmaps e gravações de sessão.",
    inputKey: "hotjarId",
    placeholder: "1234567",
    pattern: /^[0-9]{5,10}$/,
    hint: "ID numérico do site no Hotjar",
  },
  {
    id: "clarity",
    label: "Microsoft Clarity",
    description: "Análise comportamental e mapas de calor.",
    inputKey: "clarityId",
    placeholder: "abc123xyz0",
    pattern: /^[a-z0-9]{5,20}$/i,
    hint: "ID alfanumérico do projeto no Clarity",
  },
  {
    id: "pinterest",
    label: "Pinterest Tag",
    description: "Conversões para campanhas no Pinterest Ads.",
    inputKey: "pinterestId",
    placeholder: "2613024664320",
    pattern: /^[0-9]{10,16}$/,
    hint: "ID numérico da tag no Pinterest",
  },
];

// ─── Validation ───────────────────────────────────────────────────────────────

const FIELD_PATTERNS: Partial<Record<FieldKey, RegExp>> = {
  gtmContainerId: /^GTM-[A-Z0-9]+$/i,
  gaMeasurementId: /^G-[A-Z0-9]+$/i,
  facebookPixelId: /^[0-9]{5,}$/,
  tiktokPixelId: /^(TT-)?[A-Z0-9]{6,}$/i,
  googleAdsId: /^AW-[0-9]+$/i,
  hotjarId: /^[0-9]{5,10}$/,
  clarityId: /^[a-z0-9]{5,20}$/i,
  pinterestId: /^[0-9]{10,16}$/,
};

function validateField(key: FieldKey, value: string): string | null {
  const pattern = FIELD_PATTERNS[key];
  if (!pattern || !value.trim()) return null;
  return pattern.test(value.trim()) ? null : "Formato inválido";
}

function validateForm(form: TrackingFormState) {
  const errors: Partial<Record<FieldKey, string>> = {};
  PIXEL_FIELDS.forEach((f) => {
    if (form[f.toggleKey] && !form[f.inputKey as FieldKey]) {
      errors[f.inputKey] = `${f.label}: informe o ID ao ativar.`;
    }
    if (form[f.inputKey as FieldKey]) {
      const err = validateField(f.inputKey, form[f.inputKey as FieldKey] as string);
      if (err) errors[f.inputKey] = err;
    }
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapConfigToForm(config?: TrackingConfig): TrackingFormState {
  const c: TrackingConfig = config ?? {
    isGTMEnabled: false, gtmContainerId: null,
    isGAEnabled: false, gaMeasurementId: null,
    isFacebookEnabled: false, facebookPixelId: null,
    isTikTokEnabled: false, tiktokPixelId: null,
    metaDomainVerification: null, googleSiteVerification: null,
    googleAdsId: null, hotjarId: null, clarityId: null, pinterestId: null,
  };
  return {
    isGTMEnabled: Boolean(c.isGTMEnabled && c.gtmContainerId),
    gtmContainerId: c.gtmContainerId ?? "",
    isGAEnabled: Boolean(c.isGAEnabled && c.gaMeasurementId),
    gaMeasurementId: c.gaMeasurementId ?? "",
    isFacebookEnabled: Boolean(c.isFacebookEnabled && c.facebookPixelId),
    facebookPixelId: c.facebookPixelId ?? "",
    isTikTokEnabled: Boolean(c.isTikTokEnabled && c.tiktokPixelId),
    tiktokPixelId: c.tiktokPixelId ?? "",
    metaDomainVerification: c.metaDomainVerification ?? "",
    googleSiteVerification: c.googleSiteVerification ?? "",
    googleAdsId: c.googleAdsId ?? "",
    hotjarId: c.hotjarId ?? "",
    clarityId: c.clarityId ?? "",
    pinterestId: c.pinterestId ?? "",
  };
}

function normalizeInput(key: FieldKey, value: string): string {
  const trimmed = value.replace(/[<>]/g, "").trim();
  if (key === "gtmContainerId" || key === "gaMeasurementId" || key === "tiktokPixelId") {
    return trimmed.replace(/\s+/g, "").toUpperCase();
  }
  if (key === "facebookPixelId") return trimmed.replace(/\D+/g, "");
  return trimmed;
}

function envLabel(env: Environment) {
  if (env === "staging") return "Staging";
  if (env === "development") return "Dev";
  return "Produção";
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch { return "-"; }
}

function diffKeys(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return Object.keys(after).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type DiagRow = { id: string; label: string; status: "ok" | "warn" | "off" | "info"; message: string };

const STATUS_META = {
  ok: { icon: CheckCircle2, cls: "text-[var(--brand)] bg-[var(--brand-tint-50)]" },
  warn: { icon: AlertTriangle, cls: "text-amber-700 bg-amber-50" },
  off: { icon: Power, cls: "text-slate-500 bg-slate-100" },
  info: { icon: Info, cls: "text-sky-700 bg-sky-50" },
};

function DiagCard({ rows, timestamp, status }: { rows: DiagRow[]; timestamp: string; status: "ok" | "warn" }) {
  const border = status === "ok" ? "border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)]" : "border-amber-200 bg-amber-50";
  const okCount = rows.filter((r) => r.status === "ok").length;
  const warnCount = rows.filter((r) => r.status === "warn").length;
  return (
    <div className={`rounded-2xl border ${border} p-4 space-y-3`} aria-live="polite">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Diagnóstico</p>
          <p className="text-xs text-[var(--text-muted)]">Testado em {formatDate(timestamp)}</p>
        </div>
        <span className={`text-sm font-semibold ${status === "ok" ? "text-[var(--brand)]" : "text-amber-700"}`}>
          {status === "ok" ? `${okCount} prontas` : `${warnCount} pendência(s)`}
        </span>
      </div>
      <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-white">
        {rows.map((row) => {
          const { icon: Icon, cls } = STATUS_META[row.status];
          return (
            <li key={row.id} className="flex items-start gap-3 px-4 py-3">
              <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cls}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">{row.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{row.message}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function buildDiagnostics(form: TrackingFormState): { rows: DiagRow[]; status: "ok" | "warn"; timestamp: string } {
  const rows: DiagRow[] = PIXEL_FIELDS.map((f) => {
    const enabled = Boolean(form[f.toggleKey]);
    const id = String(form[f.inputKey as FieldKey] ?? "").trim();
    if (!enabled) return { id: f.id, label: f.label, status: "off", message: "Desativado." };
    if (!id) return { id: f.id, label: f.label, status: "warn", message: "Ativo sem ID." };
    if (f.pattern && !f.pattern.test(id)) return { id: f.id, label: f.label, status: "warn", message: `ID com formato inválido: ${id}` };
    return { id: f.id, label: f.label, status: "ok", message: `ID configurado: ${id}` };
  });
  rows.push({
    id: "meta-domain", label: "Meta Domain Verification",
    status: form.metaDomainVerification ? "ok" : "info",
    message: form.metaDomainVerification ? "Token configurado." : "Opcional — só cadastre se solicitado pela Meta.",
  });
  rows.push({
    id: "google-site", label: "Google Site Verification",
    status: form.googleSiteVerification ? "ok" : "info",
    message: form.googleSiteVerification ? "Token configurado." : "Opcional — use só se o Search Console exigir.",
  });
  const warns = rows.filter((r) => r.status === "warn").length;
  return { rows, status: warns > 0 ? "warn" : "ok", timestamp: new Date().toISOString() };
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = { initialEnvironment: Environment; initialConfig: TrackingConfig };

export function TrackingSettingsPage({ initialEnvironment, initialConfig }: Props) {
  const { push } = useToast();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("pixels");
  const [environment, setEnvironment] = useState<Environment>(initialEnvironment);
  const [form, setForm] = useState<TrackingFormState>(() => mapConfigToForm(initialConfig));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [loadingEnv, setLoadingEnv] = useState(false);
  const [saving, setSaving] = useState(false);
  const [diagnostic, setDiagnostic] = useState<ReturnType<typeof buildDiagnostics> | null>(null);

  // Production live config for comparison badges
  const [prodForm, setProdForm] = useState<TrackingFormState | null>(null);

  // History
  const [history, setHistory] = useState<Array<{
    id: string; environment: string; before: Record<string, unknown> | null;
    after: Record<string, unknown> | null; created_at: string;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  // Copy feedback
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Load production config for live badges
    fetch("/api/admin/tracking-settings?environment=production", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.config && setProdForm(mapConfigToForm(d.config)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "history" && history.length === 0) loadHistory();
  }, [activeTab]);

  const loadEnvironment = useCallback(
    async (env: Environment) => {
      setLoadingEnv(true);
      setFieldErrors({});
      setDiagnostic(null);
      try {
        const res = await fetch(`/api/admin/tracking-settings?environment=${env}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Falha ao carregar");
        setForm(mapConfigToForm(data.config));
        push({ type: "success", message: `Ambiente ${envLabel(env)} carregado.` });
      } catch (e) {
        push({ type: "error", message: (e as Error).message });
      } finally {
        setLoadingEnv(false);
      }
    },
    [push],
  );

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/admin/tracking-settings/history?limit=30", { cache: "no-store" });
      const d = await res.json();
      setHistory(Array.isArray(d.history) ? d.history : []);
    } catch {}
    setLoadingHistory(false);
  };

  const onEnvChange = (env: Environment) => {
    setEnvironment(env);
    loadEnvironment(env);
  };

  const onInput = (key: FieldKey, raw: string) => {
    const value = normalizeInput(key, raw);
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: validateField(key, value) ?? undefined }));
  };

  const onToggle = (key: ToggleKey, enabled: boolean) => {
    setForm((prev) => ({ ...prev, [key]: enabled }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { valid, errors } = validateForm(form);
    if (!valid) {
      setFieldErrors(errors);
      push({ type: "error", message: "Corrija os campos antes de salvar." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tracking-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment,
          ...form,
          // Extended platforms (pixels_settings)
          googleAdsId: form.googleAdsId || null,
          hotjarId: form.hotjarId || null,
          clarityId: form.clarityId || null,
          pinterestId: form.pinterestId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      setForm(mapConfigToForm(data.config));
      if (environment === "production") setProdForm(mapConfigToForm(data.config));
      push({ type: "success", message: "Tracking salvo com sucesso." });
      // Refresh history
      setHistory([]);
      if (activeTab === "history") loadHistory();
    } catch (e) {
      push({ type: "error", message: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  if (!mounted) return null;

  const isLiveInProd = (toggleKey: ToggleKey) =>
    prodForm ? prodForm[toggleKey] : false;

  const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
    { id: "pixels", label: "Pixels & Tags", icon: Tag },
    { id: "domain", label: "Verificações", icon: ShieldCheck },
    { id: "history", label: "Histórico", icon: History },
  ];

  return (
    <div className="space-y-6" aria-label="Configurações de tracking">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-[var(--text)]">Tracking & Pixels</h1>
        <p className="text-sm text-[var(--text-muted)]">Configuração central de tags, pixels e verificações de domínio.</p>
      </div>

      {/* Environment selector */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Ambiente</p>
            <p className="text-xs text-[var(--text-muted)]">Somente "Produção" impacta o site público.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ENV_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onEnvChange(opt.value)}
                disabled={loadingEnv || saving}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  environment === opt.value
                    ? opt.value === "production"
                      ? "bg-[var(--brand)] text-white"
                      : "bg-amber-500 text-white"
                    : "border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface)]"
                } disabled:opacity-50`}
              >
                {opt.label}
              </button>
            ))}
            {loadingEnv && <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" />}
          </div>
        </div>

        {/* Production status summary */}
        {prodForm && environment !== "production" && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
            <span className="text-xs text-[var(--text-muted)]">Em produção agora:</span>
            {PIXEL_FIELDS.map((f) => (
              <span
                key={f.id}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  prodForm[f.toggleKey]
                    ? "bg-[var(--brand-tint-100)] text-[var(--brand)]"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {f.label.split(" ")[0]} {prodForm[f.toggleKey] ? "✓" : "off"}
              </span>
            ))}
            {EXTENDED_FIELDS.map((f) => (
              <span
                key={f.id}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  prodForm[f.inputKey] ? "bg-[var(--brand-tint-100)] text-[var(--brand)]" : "bg-slate-100 text-slate-500"
                }`}
              >
                {f.label.split(" ")[0]} {prodForm[f.inputKey] ? "✓" : "off"}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tab panel */}
      <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        {/* Tab nav */}
        <div className="border-b border-[var(--border)]">
          <nav className="flex gap-0.5 px-4">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition ${
                  activeTab === id
                    ? "border-[var(--brand)] text-[var(--brand)]"
                    : "border-transparent text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--text)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* ════ PIXELS TAB ════ */}
            {activeTab === "pixels" && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Pixels e Tags</p>
                  <p className="text-xs text-[var(--text-muted)]">Ative apenas IDs válidos. Scripts brutos não são permitidos.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {PIXEL_FIELDS.map((field) => {
                    const idValue = form[field.inputKey as FieldKey] as string;
                    const err = fieldErrors[field.inputKey as FieldKey];
                    const isValid = idValue && !err && field.pattern?.test(idValue);
                    const liveInProd = isLiveInProd(field.toggleKey);
                    return (
                      <div
                        key={field.id}
                        className={`space-y-3 rounded-xl border p-4 shadow-sm transition ${
                          form[field.toggleKey]
                            ? "border-[var(--brand-tint-200)] bg-[var(--brand-tint-50)]"
                            : "border-[var(--border)] bg-[var(--surface)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-[var(--text)]">{field.label}</p>
                              {liveInProd && (
                                <span className="rounded-full bg-[var(--brand-tint-100)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand)]">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">{field.description}</p>
                          </div>
                          <label className="relative inline-flex shrink-0 cursor-pointer items-center" aria-label={`Ativar ${field.label}`}>
                            <input
                              type="checkbox"
                              role="switch"
                              aria-checked={form[field.toggleKey] as boolean}
                              className="peer sr-only"
                              checked={form[field.toggleKey] as boolean}
                              onChange={(e) => onToggle(field.toggleKey, e.target.checked)}
                            />
                            <div className="peer h-6 w-11 rounded-full bg-[var(--border)] transition peer-checked:bg-[var(--brand)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--brand)]" />
                            <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                          </label>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]" htmlFor={`pixel-${field.id}`}>
                              ID
                            </label>
                            {idValue && (
                              <span className={`text-[10px] font-medium ${isValid ? "text-[var(--brand)]" : "text-amber-600"}`}>
                                {isValid ? "✓ formato ok" : field.hint}
                              </span>
                            )}
                          </div>
                          <input
                            id={`pixel-${field.id}`}
                            type="text"
                            value={idValue}
                            onChange={(e) => onInput(field.inputKey, e.target.value)}
                            placeholder={field.placeholder}
                            aria-invalid={Boolean(err)}
                            className={`w-full rounded-lg border px-3 py-2 font-mono text-sm shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)] ${
                              err ? "border-rose-300 bg-rose-50" : isValid ? "border-[var(--brand-tint-300)] bg-white" : "border-[var(--border)] bg-white"
                            }`}
                          />
                          {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Extended platforms */}
                <div className="border-t border-[var(--border)] pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Mais plataformas
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {EXTENDED_FIELDS.map((field) => {
                      const value = form[field.inputKey];
                      const err = fieldErrors[field.inputKey];
                      const isValid = value && !err && field.pattern?.test(value);
                      return (
                        <div key={field.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
                          <div>
                            <p className="text-sm font-semibold text-[var(--text)]">{field.label}</p>
                            <p className="text-xs text-[var(--text-muted)]">{field.description}</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]" htmlFor={`ext-${field.id}`}>
                                ID
                              </label>
                              {value && (
                                <span className={`text-[10px] font-medium ${isValid ? "text-[var(--brand)]" : "text-amber-600"}`}>
                                  {isValid ? "✓ ok" : field.hint}
                                </span>
                              )}
                            </div>
                            <input
                              id={`ext-${field.id}`}
                              type="text"
                              value={value}
                              onChange={(e) => onInput(field.inputKey, e.target.value)}
                              placeholder={field.placeholder}
                              aria-invalid={Boolean(err)}
                              className={`w-full rounded-lg border px-3 py-2 font-mono text-sm shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)] ${
                                err ? "border-rose-300 bg-rose-50" : isValid ? "border-[var(--brand-tint-300)] bg-white" : "border-[var(--border)] bg-white"
                              }`}
                            />
                            {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {diagnostic && (
                  <DiagCard rows={diagnostic.rows} timestamp={diagnostic.timestamp} status={diagnostic.status} />
                )}

                <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
                  <button
                    type="button"
                    onClick={() => setDiagnostic(buildDiagnostics(form))}
                    disabled={saving || loadingEnv}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-tint-200)] px-4 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-tint-50)] disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Testar configuração
                  </button>
                  <button
                    type="submit"
                    disabled={saving || loadingEnv}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-hover)] disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                    {saving ? "Salvando..." : "Salvar configurações"}
                  </button>
                </div>
              </div>
            )}

            {/* ════ DOMAIN TAB ════ */}
            {activeTab === "domain" && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Verificações de Domínio</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Tokens fornecidos pelas plataformas — injetados como meta tags seguras no HEAD do site.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Meta */}
                  <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">f</div>
                      <p className="text-sm font-semibold text-[var(--text)]">Meta Domain Verification</p>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Necessário para vincular o domínio ao Business Manager e habilitar conversões avançadas.
                    </p>
                    <div className="relative">
                      <input
                        id="metaDomainVerification"
                        type="text"
                        value={form.metaDomainVerification}
                        onChange={(e) => onInput("metaDomainVerification", e.target.value)}
                        placeholder="facebook-domain-verification=..."
                        className="w-full rounded-lg border border-[var(--border)] bg-white pr-10 px-3 py-2 text-sm shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]"
                      />
                      {form.metaDomainVerification && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.metaDomainVerification, "meta")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-muted)] hover:text-[var(--brand-hover)] transition"
                          title="Copiar"
                        >
                          {copied === "meta" ? <ClipboardCheck className="h-4 w-4 text-[var(--brand)]" /> : <Copy className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Meta tag gerada: <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">{"<meta name=\"facebook-domain-verification\" content=\"...\" />"}</code>
                    </p>
                  </div>

                  {/* Google */}
                  <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">G</div>
                      <p className="text-sm font-semibold text-[var(--text)]">Google Site Verification</p>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Token para verificar propriedade no Google Search Console sem precisar de um arquivo.
                    </p>
                    <div className="relative">
                      <input
                        id="googleSiteVerification"
                        type="text"
                        value={form.googleSiteVerification}
                        onChange={(e) => onInput("googleSiteVerification", e.target.value)}
                        placeholder="google-site-verification=..."
                        className="w-full rounded-lg border border-[var(--border)] bg-white pr-10 px-3 py-2 text-sm shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-ring)]"
                      />
                      {form.googleSiteVerification && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.googleSiteVerification, "google")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-muted)] hover:text-[var(--brand-hover)] transition"
                          title="Copiar"
                        >
                          {copied === "google" ? <ClipboardCheck className="h-4 w-4 text-[var(--brand)]" /> : <Copy className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Meta tag gerada: <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px]">{"<meta name=\"google-site-verification\" content=\"...\" />"}</code>
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving || loadingEnv}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-hover)] disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
                    {saving ? "Salvando..." : "Salvar verificações"}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* ════ HISTORY TAB ════ */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Histórico de Alterações</p>
                  <p className="text-xs text-[var(--text-muted)]">Últimas 30 mudanças no tracking, por ambiente.</p>
                </div>
                <button
                  onClick={() => { setHistory([]); loadHistory(); }}
                  disabled={loadingHistory}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface)] transition disabled:opacity-50"
                >
                  {loadingHistory ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Atualizar
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center gap-2 py-8 justify-center text-sm text-[var(--text-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico...
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--text-muted)]">
                  Nenhuma alteração registrada ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => {
                    const changed = entry.before && entry.after
                      ? diffKeys(entry.before, entry.after)
                      : [];
                    const isExpanded = expandedHistory === entry.id;
                    return (
                      <div key={entry.id} className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedHistory(isExpanded ? null : entry.id)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--surface)] transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              entry.environment === "production"
                                ? "bg-[var(--brand-tint-100)] text-[var(--brand)]"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {entry.environment}
                            </span>
                            <span className="text-sm text-[var(--text)]">
                              {changed.length > 0
                                ? `${changed.length} campo(s) alterado(s)`
                                : "Configuração salva"}
                            </span>
                            {changed.length > 0 && (
                              <span className="text-xs text-[var(--text-muted)]">
                                {changed.filter((k) => !k.startsWith("is_")).slice(0, 3).join(", ")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-[var(--text-muted)]">{formatDate(entry.created_at)}</span>
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />}
                          </div>
                        </button>
                        {isExpanded && entry.before && entry.after && (
                          <div className="border-t border-[var(--border)] bg-slate-50 px-4 py-3">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p className="font-semibold text-[var(--text-muted)] mb-2">Antes</p>
                                <pre className="rounded bg-white border border-[var(--border)] p-2 text-[10px] text-[var(--text)] overflow-auto max-h-40">
                                  {JSON.stringify(
                                    Object.fromEntries(
                                      changed.map((k) => [k, (entry.before as Record<string, unknown>)[k]])
                                    ),
                                    null, 2
                                  )}
                                </pre>
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--text-muted)] mb-2">Depois</p>
                                <pre className="rounded bg-white border border-[var(--border)] p-2 text-[10px] text-[var(--text)] overflow-auto max-h-40">
                                  {JSON.stringify(
                                    Object.fromEntries(
                                      changed.map((k) => [k, (entry.after as Record<string, unknown>)[k]])
                                    ),
                                    null, 2
                                  )}
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
