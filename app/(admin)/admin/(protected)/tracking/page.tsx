import "server-only";
import type { Metadata } from "next";

import { getPixelsSettings, resolveActiveEnvironment } from "@/lib/pixels";
import { resolveTracking } from "@/lib/tracking";
import { TrackingSettingsForm } from "./TrackingSettingsForm";

export const metadata: Metadata = {
  title: "Tracking & Analytics | Admin",
  description: "Gerenciamento de eventos, pixels e analytics",
};

export default async function TrackingPage() {
  const pixelSettings = await getPixelsSettings();
  const { name: envName, config } = resolveActiveEnvironment(pixelSettings);
  const ids = resolveTracking(null, config, process.env);

  const isConfigured = (id: string | null | undefined) => Boolean(id && id.length > 3);
  const totalConfigured = [ids.gtm, ids.ga4, ids.fb, ids.tiktok, ids.pinterest, ids.hotjar, ids.clarity].filter(
    isConfigured
  ).length;

  const providers = [
    { id: "google_tag_manager", name: "Google Tag Manager", value: ids.gtm, doc: "GTM-XXXXXXX" },
    { id: "google_analytics", name: "Google Analytics 4", value: ids.ga4, doc: "G-XXXXXXX" },
    { id: "facebook", name: "Meta / Facebook Pixel", value: ids.fb, doc: "ID numérico" },
    { id: "tiktok", name: "TikTok Pixel", value: ids.tiktok, doc: "TT-XXXX" },
  ] as const;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-zinc-900">Tracking & Analytics</h1>
        <p className="text-sm text-zinc-600">Monitore eventos, pixels e performance.</p>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Ambiente ativo:</span>
          <span
            className={`rounded-full px-3 py-1 font-semibold ${
              envName === "production" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {envName === "production" ? "Produção" : "Staging"}
          </span>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Pixels ativos" helper="Facebook, Google, TikTok e outros">
          <p className="text-2xl font-bold text-purple-600">{totalConfigured}</p>
          <p className="text-xs text-zinc-500">Configurados</p>
        </Card>
        <Card title="Eventos recentes" helper="Últimos 24h">
          <p className="text-2xl font-bold text-emerald-600">-</p>
          <p className="text-xs text-zinc-500">Aguardando eventos</p>
        </Card>
        <Card title="Status geral" helper="Pixels essenciais">
          <ul className="space-y-1 text-sm text-zinc-700">
            <StatusLine label="GTM" value={ids.gtm} active={isConfigured(ids.gtm)} />
            <StatusLine label="GA4" value={ids.ga4} active={isConfigured(ids.ga4)} />
            <StatusLine label="Facebook Pixel" value={ids.fb} active={isConfigured(ids.fb)} />
            <StatusLine label="TikTok" value={ids.tiktok} active={isConfigured(ids.tiktok)} />
          </ul>
        </Card>
      </div>

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-zinc-900">Provedores</h2>
          <p className="text-sm text-zinc-600">
            Conecte via OAuth ou edite manualmente. Após conectar, o primeiro recurso é salvo e habilitado automaticamente.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((prov) => (
            <div key={prov.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="font-semibold text-zinc-900">{prov.name}</h3>
              <p className="mt-1 text-sm text-zinc-600">ID: {prov.value || "Não configurado"}</p>
              <p className="mt-2 text-xs text-zinc-500">Formato: {prov.doc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-zinc-900">Configurações e IDs</h2>
          <p className="text-sm text-zinc-600">
            Insira ou ajuste os IDs de GTM, GA4, Meta Pixel e outros. Após salvar, as tags são injetadas automaticamente no site.
          </p>
        </div>
        <TrackingSettingsForm />
      </section>
    </div>
  );
}

function Card({ title, helper, children }: { title: string; helper: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1 text-sm text-zinc-600">{helper}</p>
      <div className="mt-4 space-y-1">{children}</div>
    </div>
  );
}

function StatusLine({ label, value, active }: { label: string; value?: string | null; active: boolean }) {
  return (
    <li className="flex items-center justify-between rounded border border-zinc-100 px-3 py-2 text-sm">
      <div>
        <p className="font-semibold text-zinc-800">{label}</p>
        <p className="text-xs text-zinc-500">{value ?? "Não configurado"}</p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          active ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"
        }`}
        aria-label={active ? `${label} ativo` : `${label} inativo`}
      >
        {active ? "Ativo" : "Inativo"}
      </span>
    </li>
  );
}
