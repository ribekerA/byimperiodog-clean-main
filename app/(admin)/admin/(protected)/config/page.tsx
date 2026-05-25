import type { Metadata } from "next";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { applyGeneralDefaults, GENERAL_COLUMN_SELECT, type GeneralSettings } from "@/lib/admin/generalConfig";
import { getTrackingConfig } from "@/lib/tracking/getTrackingConfig";

import { ConfigTabs } from "./ui/ConfigTabs";

const TRACKING_ENVIRONMENTS = new Set(["production", "staging", "development"]);

export const metadata: Metadata = {
  title: "Configurações | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminConfigPage() {
  const sb = supabaseAdmin();
  const runtimeEnv = resolveRuntimeEnvironment();
  const [siteResult, legacyResult, trackingConfig] = await Promise.all([
    sb.from("site_settings").select(GENERAL_COLUMN_SELECT).eq("id", 1).maybeSingle(),
    sb.from("admin_config").select(GENERAL_COLUMN_SELECT).eq("id", "default").maybeSingle(),
    getTrackingConfig(runtimeEnv.trackingEnvironment),
  ]);

  if (siteResult.error && !siteResult.data) {
    console.warn("[admin/config] site_settings não disponível:", siteResult.error.message);
  }
  if (legacyResult.error && !legacyResult.data) {
    console.warn("[admin/config] admin_config não disponível:", legacyResult.error.message);
  }

  const merged: Partial<GeneralSettings> = {
    ...((legacyResult.data as Partial<GeneralSettings> | null) ?? {}),
    ...((siteResult.data as Partial<GeneralSettings> | null) ?? {}),
  };

  const generalConfig = applyGeneralDefaults(Object.keys(merged).length ? merged : null);

  return (
    <div className="space-y-8">
      <header className="space-y-3 rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Console</p>
            <h1 className="text-3xl font-semibold text-[var(--text)]">Configurações</h1>
            <p className="text-sm text-[var(--text-muted)]">Centralize dados da marca e integrações de tracking por ambiente.</p>
          </div>
          <div className="space-y-2 text-right text-xs text-[var(--text-muted)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-1">
              <span className="font-semibold">Ambiente ativo</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${runtimeEnv.badgeClass}`}>{runtimeEnv.label}</span>
            </div>
            <p>Somente Produção impacta o site público.</p>
          </div>
        </div>
      </header>
      <ConfigTabs
        initialGeneral={generalConfig}
        trackingConfig={trackingConfig}
        trackingEnvironment={runtimeEnv.trackingEnvironment}
        runtimeEnvLabel={runtimeEnv.label}
        runtimeEnvValue={runtimeEnv.value}
      />
    </div>
  );
}

function resolveRuntimeEnvironment() {
  const value = (process.env.NEXT_PUBLIC_APP_ENV || process.env.APP_ENV || process.env.NODE_ENV || "development").toLowerCase();
  const label = value === "production" ? "Produção" : value === "staging" ? "Staging" : "Development";
  const badgeClass =
    value === "production"
      ? "bg-emerald-100 text-emerald-800"
      : value === "staging"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-200 text-slate-800";

  const trackingEnvironment = TRACKING_ENVIRONMENTS.has(value) ? (value as "production" | "staging" | "development") : "production";

  return { value, label, badgeClass, trackingEnvironment };
}
