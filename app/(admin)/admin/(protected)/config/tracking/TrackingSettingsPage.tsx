"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, Power, ShieldCheck, Wifi, WifiOff } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import type { TrackingConfig } from "@/lib/tracking/getTrackingConfig";

const ENV_OPTIONS = [
  { value: "production", label: "Produção" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
] as const;

type Environment = (typeof ENV_OPTIONS)[number]["value"];

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
};

type FieldKey = keyof TrackingFormState;
type ToggleKey = "isGTMEnabled" | "isGAEnabled" | "isFacebookEnabled" | "isTikTokEnabled";

type PixelField = {
  id: "gtm" | "ga4" | "facebook" | "tiktok";
  label: string;
  description: string;
  toggleKey: ToggleKey;
  inputKey: FieldKey;
  placeholder: string;
};

const PIXEL_FIELDS: PixelField[] = [
  {
    id: "gtm" as const,
    label: "Google Tag Manager",
    description: "Centraliza scripts (GA4, Meta, Ads) e controla firing rules sem deploy.",
    toggleKey: "isGTMEnabled" as const,
    inputKey: "gtmContainerId" as const,
    placeholder: "GTM-XXXXXXX",
  },
  {
    id: "ga4" as const,
    label: "Google Analytics 4",
    description: "Mede tráfego e funil de conversão no GA4.",
    toggleKey: "isGAEnabled" as const,
    inputKey: "gaMeasurementId" as const,
    placeholder: "G-XXXXXXX",
  },
  {
    id: "facebook" as const,
    label: "Meta / Facebook Pixel",
    description: "Permite remarketing e conversões no Ads Manager.",
    toggleKey: "isFacebookEnabled" as const,
    inputKey: "facebookPixelId" as const,
    placeholder: "1234567890",
  },
  {
    id: "tiktok" as const,
    label: "TikTok Pixel",
    description: "Trackeia eventos para campanhas de TikTok Ads.",
    toggleKey: "isTikTokEnabled" as const,
    inputKey: "tiktokPixelId" as const,
    placeholder: "TT-XXXXXX",
  },
];

type DiagnosticRow = {
  id: string;
  label: string;
  status: "ok" | "warn" | "off" | "info";
  message: string;
};

type DiagnosticResult = {
  status: "ok" | "warn";
  rows: DiagnosticRow[];
  summary: string;
  timestamp: string;
};

const STATUS_META: Record<DiagnosticRow["status"], { icon: typeof CheckCircle2; iconClass: string; circleClass: string }> = {
  ok: { icon: CheckCircle2, iconClass: "text-emerald-700", circleClass: "bg-emerald-50" },
  warn: { icon: AlertTriangle, iconClass: "text-amber-700", circleClass: "bg-amber-50" },
  off: { icon: Power, iconClass: "text-slate-500", circleClass: "bg-slate-100" },
  info: { icon: Info, iconClass: "text-sky-700", circleClass: "bg-sky-50" },
};

type Props = {
  initialEnvironment: Environment;
  initialConfig: TrackingConfig;
};

export function TrackingSettingsPage({ initialEnvironment, initialConfig }: Props) {
  const { push } = useToast();
  const [environment, setEnvironment] = useState<Environment>(initialEnvironment);
  const [form, setForm] = useState<TrackingFormState>(() => mapConfigToForm(initialConfig));
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [loadingEnv, setLoadingEnv] = useState(false);
  const [saving, setSaving] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  const loadEnvironment = useCallback(
    async (env: Environment) => {
      setLoadingEnv(true);
      setErrors({});
      try {
        const res = await fetch(`/api/admin/tracking-settings?environment=${env}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Falha ao carregar");
        }
        setForm(mapConfigToForm(data.config));
        setDiagnostic(null);
        push({ type: "success", message: `Ambiente ${envLabel(env)} carregado.` });
      } catch (error) {
        push({ type: "error", message: (error as Error).message || "Não foi possível carregar o ambiente." });
      } finally {
        setLoadingEnv(false);
      }
    },
    [push],
  );

  const onEnvironmentChange = (env: Environment) => {
    setEnvironment(env);
    loadEnvironment(env);
  };

  const onInputChange = (key: FieldKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: normalizeInput(key, value) }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onToggleChange = (key: ToggleKey, enabled: boolean) => {
    setForm((prev) => ({ ...prev, [key]: enabled }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      push({ type: "error", message: "Corrija os campos destacados antes de salvar." });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/admin/tracking-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment, ...form }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar");
      }
      setForm(mapConfigToForm(data.config));
      push({ type: "success", message: "Tracking atualizado com sucesso." });
    } catch (error) {
      push({ type: "error", message: (error as Error).message || "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConfig = () => {
    const result = buildDiagnostics(form);
    setDiagnostic(result);
    push({ type: result.status === "ok" ? "success" : "warning", message: result.summary });
  };

  return (
    <section className="space-y-6" aria-label="Configurações de tracking">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-[var(--text)]">Tracking & Pixels</h1>
        <p className="text-sm text-[var(--text-muted)]">Configuração central de tags, pixels e verificações.</p>
      </header>

      <div className="rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Ambiente</p>
            <p className="text-xs text-[var(--text-muted)]">Somente "Produção" impacta o site público.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={environment}
              onChange={(e) => onEnvironmentChange(e.target.value as Environment)}
              disabled={loadingEnv || saving}
              className="h-10 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {ENV_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {loadingEnv ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text-muted)]" aria-label="Carregando ambiente" />
            ) : (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${environment === "production" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                aria-live="polite"
              >
                {environment === "production" ? (
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" aria-hidden />
                )}
                {envLabel(environment)}
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-4 rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-5 shadow-sm">
          <header>
            <h2 className="text-xl font-semibold text-[var(--text)]">Pixels e Tags</h2>
            <p className="text-sm text-[var(--text-muted)]">Ative apenas IDs válidos. Scripts brutos não são permitidos.</p>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            {PIXEL_FIELDS.map((field) => (
              <ToggleCard
                key={field.id}
                label={field.label}
                description={field.description}
                inputId={`pixel-${field.id}`}
                enabled={form[field.toggleKey] as boolean}
                onToggle={(value) => onToggleChange(field.toggleKey, value)}
                inputValue={form[field.inputKey] as string}
                onInputChange={(value) => onInputChange(field.inputKey, value)}
                placeholder={field.placeholder}
                error={errors[field.inputKey]}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-[var(--radius-2xl)] border border-[var(--border)] bg-white p-5 shadow-sm">
          <header>
            <h2 className="text-xl font-semibold text-[var(--text)]">Verificações de domínio</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Use os tokens fornecidos pelas plataformas. Eles serão injetados apenas como meta tags seguras.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Meta Domain Verification"
              id="metaDomainVerification"
              value={form.metaDomainVerification}
              placeholder="facebook-domain-verification=..."
              onChange={(value) => onInputChange("metaDomainVerification", value)}
              error={errors.metaDomainVerification}
            />
            <TextField
              label="Google Site Verification"
              id="googleSiteVerification"
              value={form.googleSiteVerification}
              placeholder="google-site-verification=..."
              onChange={(value) => onInputChange("googleSiteVerification", value)}
              error={errors.googleSiteVerification}
            />
          </div>
        </section>

        {diagnostic && <DiagnosticsCard result={diagnostic} />}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 text-xs text-[var(--text-muted)]">
            <button
              type="button"
              onClick={handleTestConfig}
              disabled={saving || loadingEnv}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Testar configuração
            </button>
            <span>As alterações ficam restritas ao ambiente selecionado. Cada salvamento gera log de auditoria.</span>
          </div>
          <button
            type="submit"
            disabled={saving || loadingEnv}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Wifi className="h-4 w-4" aria-hidden />}
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </form>
    </section>
  );
}

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function DiagnosticsCard({ result }: { result: DiagnosticResult }) {
  const borderClass = result.status === "ok" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50";
  const summaryClass = result.status === "ok" ? "text-emerald-700" : "text-amber-700";
  return (
    <section className={`space-y-3 rounded-[var(--radius-2xl)] border ${borderClass} p-4`} aria-live="polite">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">Diagnóstico rápido</p>
          <p className="text-xs text-[var(--text-muted)]">Último teste: {formatDiagnosticDate(result.timestamp)}</p>
        </div>
        <span className={`text-sm font-semibold ${summaryClass}`}>{result.summary}</span>
      </div>
      <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-white">
        {result.rows.map((row) => {
          const meta = STATUS_META[row.status];
          const Icon = meta.icon;
          return (
            <li key={row.id} className="flex items-start gap-3 px-4 py-3">
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${meta.circleClass}`}>
                <Icon className={`h-4 w-4 ${meta.iconClass}`} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">{row.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{row.message}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatDiagnosticDate(value: string) {
  try {
    return DATE_FORMATTER.format(new Date(value));
  } catch {
    return "-";
  }
}

function buildDiagnostics(form: TrackingFormState): DiagnosticResult {
  const rows: DiagnosticRow[] = PIXEL_FIELDS.map((field) => {
    const enabled = Boolean(form[field.toggleKey]);
    const idValue = String(form[field.inputKey] ?? "").trim();
    if (!enabled) {
      return {
        id: field.id,
        label: field.label,
        status: "off",
        message: "Desativado neste ambiente.",
      };
    }
    if (idValue.length > 0) {
      return {
        id: field.id,
        label: field.label,
        status: "ok",
        message: "ID configurado e pronto para disparo.",
      };
    }
    return {
      id: field.id,
      label: field.label,
      status: "warn",
      message: "Ativo sem ID. Informe o identificador antes de publicar.",
    };
  });

  rows.push({
    id: "meta-domain",
    label: "Meta Domain Verification",
    status: form.metaDomainVerification ? "ok" : "info",
    message: form.metaDomainVerification ? "Token será inserido no HEAD." : "Opcional: cadastre apenas se solicitado pela Meta.",
  });

  rows.push({
    id: "google-site",
    label: "Google Site Verification",
    status: form.googleSiteVerification ? "ok" : "info",
    message: form.googleSiteVerification ? "Tag de verificação configurada." : "Opcional: use apenas se o Search Console exigir.",
  });

  const blockers = rows.filter((row) => row.status === "warn");
  const status: DiagnosticResult["status"] = blockers.length ? "warn" : "ok";
  const summary =
    status === "ok"
      ? `${rows.filter((row) => row.status === "ok").length} integrações prontas para produção.`
      : `Encontramos ${blockers.length} pendência(s) nas integrações ativas.`;

  return { status, rows, summary, timestamp: new Date().toISOString() };
}

function mapConfigToForm(config?: TrackingConfig): TrackingFormState {
  const safe: TrackingConfig =
    config ?? {
      isGTMEnabled: false,
      gtmContainerId: null,
      isGAEnabled: false,
      gaMeasurementId: null,
      isFacebookEnabled: false,
      facebookPixelId: null,
      isTikTokEnabled: false,
      tiktokPixelId: null,
      metaDomainVerification: null,
      googleSiteVerification: null,
    };

  return {
    isGTMEnabled: Boolean(safe.isGTMEnabled && safe.gtmContainerId),
    gtmContainerId: safe.gtmContainerId ?? "",
    isGAEnabled: Boolean(safe.isGAEnabled && safe.gaMeasurementId),
    gaMeasurementId: safe.gaMeasurementId ?? "",
    isFacebookEnabled: Boolean(safe.isFacebookEnabled && safe.facebookPixelId),
    facebookPixelId: safe.facebookPixelId ?? "",
    isTikTokEnabled: Boolean(safe.isTikTokEnabled && safe.tiktokPixelId),
    tiktokPixelId: safe.tiktokPixelId ?? "",
    metaDomainVerification: safe.metaDomainVerification ?? "",
    googleSiteVerification: safe.googleSiteVerification ?? "",
  };
}

function validateForm(form: TrackingFormState) {
  const errors: Partial<Record<FieldKey, string>> = {};
  PIXEL_FIELDS.forEach((field) => {
    if (form[field.toggleKey] && !form[field.inputKey]) {
      errors[field.inputKey] = `${field.label}: informe o ID ao ativar.`;
    }
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

function normalizeInput(key: FieldKey, value: string) {
  const trimmed = value.replace(/[<>]/g, "").trim();
  if (key === "gtmContainerId" || key === "gaMeasurementId" || key === "tiktokPixelId") {
    return trimmed.replace(/\s+/g, "").toUpperCase();
  }
  if (key === "facebookPixelId") {
    return trimmed.replace(/\D+/g, "");
  }
  return trimmed;
}

function envLabel(env: Environment) {
  switch (env) {
    case "staging":
      return "Staging";
    case "development":
      return "Development";
    default:
      return "Produção";
  }
}

type ToggleCardProps = {
  label: string;
  description: string;
  inputId: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  placeholder?: string;
  error?: string;
};

function ToggleCard({ label, description, inputId, enabled, onToggle, inputValue, onInputChange, placeholder, error }: ToggleCardProps) {
  return (
    <div className="space-y-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">{label}</p>
          <p className="text-xs text-[var(--text-muted)]">{description}</p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center" aria-label={`Ativar ${label}`}>
          <input
            type="checkbox"
            role="switch"
            aria-checked={enabled}
            className="peer sr-only"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
          />
          <div className="peer h-6 w-11 rounded-full bg-[var(--border)] transition peer-checked:bg-emerald-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-500" />
          <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
        </label>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]" htmlFor={inputId}>
          ID
        </label>
        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
            error ? "border-rose-300 bg-rose-50" : "border-[var(--border)] bg-white"
          }`}
        />
        {error && (
          <p className="mt-1 text-xs text-rose-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

type TextFieldProps = {
  label: string;
  id: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
};

function TextField({ label, id, value, placeholder, onChange, error }: TextFieldProps) {
  return (
    <label htmlFor={id} className="space-y-1 text-sm font-semibold text-[var(--text)]">
      {label}
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
          error ? "border-rose-300 bg-rose-50" : "border-[var(--border)] bg-white"
        }`}
      />
      {error && (
        <span className="text-xs text-rose-600" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
