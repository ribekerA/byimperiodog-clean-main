"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal, Wifi } from "lucide-react";

import type { GeneralSettings } from "@/lib/admin/generalConfig";
import type { TrackingConfig } from "@/lib/tracking/getTrackingConfig";

import { ConfigForm } from "./ConfigForm";
import { TrackingSettingsPage } from "../tracking/TrackingSettingsPage";

type TabId = "general" | "tracking";

type ConfigTabsProps = {
  initialGeneral: GeneralSettings;
  trackingEnvironment: "production" | "staging" | "development";
  trackingConfig: TrackingConfig;
  runtimeEnvLabel: string;
  runtimeEnvValue: string;
};

const TABS: Array<{ id: TabId; label: string; description: string; icon: ReactNode }> = [
  {
    id: "general",
    label: "Geral",
    description: "Marca, contatos e textos padrão",
    icon: <SlidersHorizontal className="h-4 w-4" aria-hidden />,
  },
  {
    id: "tracking",
    label: "Tracking & Pixels",
    description: "IDs verificados, toggles e auditoria",
    icon: <Wifi className="h-4 w-4" aria-hidden />,
  },
];

export function ConfigTabs({ initialGeneral, trackingEnvironment, trackingConfig, runtimeEnvLabel, runtimeEnvValue }: ConfigTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  return (
    <section className="space-y-4" aria-label="Configurações do site">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav className="inline-flex rounded-full border border-[var(--border)] bg-white p-1 shadow-sm" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`${tab.id}-tab`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              data-state={activeTab === tab.id ? "active" : "inactive"}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${
                activeTab === tab.id ? "bg-emerald-600 text-white" : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <span>Ambiente atual:</span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[var(--text)] ${
              runtimeEnvValue === "production"
                ? "bg-emerald-100 text-emerald-800"
                : runtimeEnvValue === "staging"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-200 text-slate-800"
            }`}
          >
            {runtimeEnvLabel}
          </span>
        </div>
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        {TABS.find((tab) => tab.id === activeTab)?.description}
      </p>

      <div className="space-y-6">
        <section id="general-panel" role="tabpanel" aria-labelledby="general-tab" hidden={activeTab !== "general"}>
          <ConfigForm initialData={initialGeneral} />
        </section>
        <section id="tracking-panel" role="tabpanel" aria-labelledby="tracking-tab" hidden={activeTab !== "tracking"}>
          <TrackingSettingsPage initialEnvironment={trackingEnvironment} initialConfig={trackingConfig} />
        </section>
      </div>
    </section>
  );
}
