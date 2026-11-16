import { Settings } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { applyGeneralDefaults, GENERAL_COLUMN_SELECT, type GeneralSettings } from "@/lib/admin/generalConfig";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getTrackingConfig } from "@/lib/tracking/getTrackingConfig";

import { CabecalhoPagina } from "../_ui/CabecalhoPagina";
import { Jornada, type EtapaJornada } from "../_ui/Jornada";

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

  const preenchido = (v: string | null | undefined) => typeof v === "string" && v.trim().length > 0;
  // Etapas medidas no que esta salvo agora (site_settings e tracking). Campo
  // que so tem o texto padrao do codigo conta como feito apenas onde o padrao
  // ja e o que o site usa (mensagem de WhatsApp, SEO); contato e redes nao tem
  // padrao e so contam quando alguem preencheu.
  const irAba = (hash: "#geral" | "#tracking", rotulo: string) => (
    <a
      href={hash}
      className="inline-block rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
    >
      {rotulo}
    </a>
  );
  const etapas: EtapaJornada[] = [
    {
      id: "contato",
      titulo: "Contato da marca",
      descricao: "E-mail e telefone de contato preenchidos na aba Geral.",
      feito: preenchido(generalConfig.contact_email) && preenchido(generalConfig.contact_phone),
      acao: irAba("#geral", "Preencher contato"),
    },
    {
      id: "redes",
      titulo: "Redes sociais",
      descricao: "Instagram informado na aba Geral.",
      feito: preenchido(generalConfig.instagram),
      resultado: generalConfig.instagram || undefined,
      acao: irAba("#geral", "Informar Instagram"),
    },
    {
      id: "whatsapp",
      titulo: "Mensagem inicial do WhatsApp",
      descricao: "Texto que abre a conversa quando alguem clica no botao de WhatsApp.",
      feito: preenchido(generalConfig.whatsapp_message),
      acao: irAba("#geral", "Escrever mensagem"),
    },
    {
      id: "seo",
      titulo: "Titulo e descricao padrao de SEO",
      descricao: "Usados nas paginas que nao definem os proprios.",
      feito: preenchido(generalConfig.seo_title_default) && preenchido(generalConfig.seo_description_default),
      acao: irAba("#geral", "Preencher SEO"),
    },
    {
      id: "gtm",
      titulo: "Google Tag Manager ativo",
      descricao: "Container GTM ligado e com ID na aba de tracking. O GA4 e as conversoes do Ads rodam dentro dele.",
      feito: trackingConfig.isGTMEnabled && preenchido(trackingConfig.gtmContainerId),
      resultado: trackingConfig.gtmContainerId ? <span className="font-mono">{trackingConfig.gtmContainerId}</span> : undefined,
      acao: irAba("#tracking", "Abrir Tracking & Pixels"),
    },
    // Sem etapa "GA4 ativo": o GA4 (G-WZ9RQKW48Z) roda dentro do container
    // GTM, e o site so carrega GA4 direto quando o GTM esta desligado. Cobrar
    // o toggle empurraria a pessoa a duplicar a medicao.
    {
      id: "ads",
      titulo: "Conversoes do Google Ads",
      descricao: "ID AW- presente na configuração do site. A tela do Google Ads grava lendo direto da conta.",
      feito: preenchido(trackingConfig.googleAdsId),
      resultado: trackingConfig.googleAdsId ? <span className="font-mono">{trackingConfig.googleAdsId}</span> : undefined,
      acao: (
        <Link
          href="/admin/config/google-ads"
          className="inline-block rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Abrir Google Ads
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        sobretitulo="Plataforma"
        titulo="Configurações"
        icone={<Settings className="h-6 w-6" />}
        descricao="Dados da marca, mensagens e integrações de tracking por ambiente."
        acoes={
          <div className="flex flex-col items-end gap-1 text-xs text-[var(--text-muted)]">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${runtimeEnv.badgeClass}`}>
              Ambiente: {runtimeEnv.label}
            </span>
            <span>Somente Produção impacta o site público.</span>
          </div>
        }
      />
      <Jornada titulo="Configuração do site" etapas={etapas} />
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
      ? "bg-[var(--brand-tint-100)] text-[var(--brand)]"
      : value === "staging"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-200 text-slate-800";

  const trackingEnvironment = TRACKING_ENVIRONMENTS.has(value) ? (value as "production" | "staging" | "development") : "production";

  return { value, label, badgeClass, trackingEnvironment };
}
