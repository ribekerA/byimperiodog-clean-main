"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import type { GeneralSettings } from "@/lib/admin/generalConfig";

export function ConfigForm({ initialData }: { initialData: GeneralSettings }) {
  const [form, setForm] = useState<GeneralSettings>(initialData);
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onChange = (key: keyof GeneralSettings, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "Erro ao salvar");
        }
        if (data?.config) {
          setForm(data.config as GeneralSettings);
        }
        setMessage("Configurações salvas com sucesso.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível salvar. Tente novamente.");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" aria-label="Configurações gerais, funil e SEO">
      <Section title="Dados da marca" subtitle="Informações básicas exibidas no site e comunicação.">
        <Field label="Nome da marca" id="brand_name" value={form.brand_name} onChange={(v) => onChange("brand_name", v)} required />
        <Field
          label="Tagline / posição"
          id="brand_tagline"
          value={form.brand_tagline}
          onChange={(v) => onChange("brand_tagline", v)}
          required
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Email de contato"
            id="contact_email"
            type="email"
            value={form.contact_email}
            onChange={(v) => onChange("contact_email", v)}
          />
          <Field label="Telefone principal" id="contact_phone" value={form.contact_phone} onChange={(v) => onChange("contact_phone", v)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Instagram" id="instagram" value={form.instagram} onChange={(v) => onChange("instagram", v)} />
          <Field label="TikTok" id="tiktok" value={form.tiktok} onChange={(v) => onChange("tiktok", v)} />
        </div>
        <TextArea
          label="Mensagem padrão do WhatsApp"
          id="whatsapp_message"
          value={form.whatsapp_message}
          onChange={(v) => onChange("whatsapp_message", v)}
          hint="Usada como template inicial nos links de WhatsApp."
        />
      </Section>

      <Section title="Funil e follow-up" subtitle="Templates de mensagens e tempo de resposta.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea
            label="Template de primeiro contato"
            id="template_first_contact"
            value={form.template_first_contact}
            onChange={(v) => onChange("template_first_contact", v)}
          />
          <TextArea
            label="Template de follow-up"
            id="template_followup"
            value={form.template_followup}
            onChange={(v) => onChange("template_followup", v)}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Tempo médio de resposta (minutos)"
            id="avg_response_minutes"
            type="number"
            min={1}
            value={form.avg_response_minutes}
            onChange={(v) => onChange("avg_response_minutes", Number(v))}
          />
          <TextArea
            label="Regras de follow-up"
            id="followup_rules"
            value={form.followup_rules}
            onChange={(v) => onChange("followup_rules", v)}
            hint="Ex.: responder em até 30 min, 2 follow-ups em 24h, oferta expira em 48h."
          />
        </div>
      </Section>

      <Section title="SEO global" subtitle="Defaults aplicados em páginas sem override específico.">
        <Field
          label="Title default"
          id="seo_title_default"
          value={form.seo_title_default}
          onChange={(v) => onChange("seo_title_default", v)}
          required
        />
        <TextArea
          label="Description default"
          id="seo_description_default"
          value={form.seo_description_default}
          onChange={(v) => onChange("seo_description_default", v)}
          required
        />
        <TextArea
          label="Meta tags padrão (separadas por vírgula)"
          id="seo_meta_tags"
          value={form.seo_meta_tags}
          onChange={(v) => onChange("seo_meta_tags", v)}
          hint="Ex.: spitz, lulu da pomerânia, filhotes, criação responsável"
        />
      </Section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Salvar configurações
        </button>
        {message && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {message}
          </span>
        )}
        {error && <span className="text-sm font-semibold text-rose-700">{error}</span>}
      </div>
    </form>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
        <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  required,
  min,
}: {
  label: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  required?: boolean;
  min?: number;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm font-semibold text-[var(--text)]">
      {label} {required && <span className="text-rose-600">*</span>}
      <input
        id={id}
        name={id}
        type={type}
        min={min}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
    </label>
  );
}

function TextArea({
  label,
  id,
  value,
  onChange,
  hint,
  required,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm font-semibold text-[var(--text)]">
      {label} {required && <span className="text-rose-600">*</span>}
      <textarea
        id={id}
        name={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[120px] rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
      {hint && <span className="text-xs font-normal text-[var(--text-muted)]">{hint}</span>}
    </label>
  );
}
