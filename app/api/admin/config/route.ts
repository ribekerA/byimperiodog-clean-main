export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import {
  applyGeneralDefaults,
  GENERAL_COLUMN_SELECT,
  GENERAL_DEFAULTS,
  GENERAL_TEXT_FIELDS,
  type GeneralSettings,
  type GeneralTextField,
} from "@/lib/admin/generalConfig";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const REQUIRED_FIELDS: GeneralTextField[] = [
  "brand_name",
  "brand_tagline",
  "seo_title_default",
  "seo_description_default",
];

const FIELD_LABELS: Record<keyof GeneralSettings, string> = {
  brand_name: "Nome da marca",
  brand_tagline: "Tagline",
  contact_email: "Email de contato",
  contact_phone: "Telefone principal",
  instagram: "Instagram",
  tiktok: "TikTok",
  whatsapp_message: "Mensagem padrão do WhatsApp",
  template_first_contact: "Template de primeiro contato",
  template_followup: "Template de follow-up",
  followup_rules: "Regras de follow-up",
  avg_response_minutes: "Tempo médio de resposta",
  seo_title_default: "SEO title",
  seo_description_default: "SEO description",
  seo_meta_tags: "Meta tags",
};

const FIELD_LIMITS: Partial<Record<GeneralTextField, number>> = {
  brand_name: 80,
  brand_tagline: 160,
  contact_email: 120,
  contact_phone: 40,
  instagram: 120,
  tiktok: 120,
  whatsapp_message: 500,
  template_first_contact: 500,
  template_followup: 500,
  followup_rules: 400,
  seo_title_default: 120,
  seo_description_default: 320,
  seo_meta_tags: 260,
};

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export async function GET(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const sb = supabaseAdmin();
  const [siteResult, legacyResult] = await Promise.all([
    sb.from("site_settings").select(GENERAL_COLUMN_SELECT).eq("id", 1).maybeSingle(),
    sb.from("admin_config").select(GENERAL_COLUMN_SELECT).eq("id", "default").maybeSingle(),
  ]);

  if (siteResult.error && !siteResult.data && legacyResult.error && !legacyResult.data) {
    return NextResponse.json({ error: siteResult.error?.message ?? legacyResult.error?.message ?? "Erro ao carregar" }, { status: 500 });
  }

  const merged: Partial<GeneralSettings> = {
    ...((legacyResult.data as Partial<GeneralSettings> | null) ?? {}),
    ...((siteResult.data as Partial<GeneralSettings> | null) ?? {}),
  };

  const config = applyGeneralDefaults(Object.keys(merged).length ? merged : null);

  return NextResponse.json({ config });
}

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  try {
    const payload = sanitizeGeneralPayload(body);
    const { data, error } = await sb
      .from("site_settings")
      .upsert({ id: 1, ...payload, updated_at: new Date().toISOString() }, { onConflict: "id" })
      .select(GENERAL_COLUMN_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Mantém admin_config sincronizado (legado) sem bloquear operação principal
    syncLegacyConfig(sb, payload).catch((err) => {
      console.warn("[admin-config] legacy sync falhou:", err);
    });

    const config = applyGeneralDefaults((data as Partial<GeneralSettings> | null) ?? payload);
    return NextResponse.json({ ok: true, config });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[admin-config] erro ao salvar:", error);
    return NextResponse.json({ error: "Não foi possível salvar as configurações." }, { status: 500 });
  }
}

function sanitizeGeneralPayload(input: unknown): GeneralSettings {
  const source = (input ?? {}) as Record<string, unknown>;
  const sanitized: Partial<GeneralSettings> = {};

  GENERAL_TEXT_FIELDS.forEach((field) => {
    sanitized[field] = sanitizeTextField(field, source[field], REQUIRED_FIELDS.includes(field));
  });

  sanitized.avg_response_minutes = sanitizeResponseMinutes(source.avg_response_minutes);

  return sanitized as GeneralSettings;
}

function sanitizeTextField(field: GeneralTextField, value: unknown, required: boolean): string {
  const raw = typeof value === "string" ? value : "";
  const cleaned = raw.trim();

  if (/<\/?script/i.test(cleaned)) {
    throw new ValidationError(`${FIELD_LABELS[field]}: scripts não são permitidos.`);
  }

  const hasAngles = /[<>]/.test(cleaned);
  if (hasAngles) {
    throw new ValidationError(`${FIELD_LABELS[field]}: use apenas texto, sem tags HTML.`);
  }

  const limit = FIELD_LIMITS[field] ?? 600;
  if (cleaned.length > limit) {
    throw new ValidationError(`${FIELD_LABELS[field]}: limite de ${limit} caracteres.`);
  }

  if (required && cleaned.length === 0) {
    throw new ValidationError(`${FIELD_LABELS[field]} é obrigatório.`);
  }

  if (field === "contact_email" && cleaned.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleaned)) {
      throw new ValidationError("Email de contato inválido.");
    }
  }

  return cleaned;
}

function sanitizeResponseMinutes(value: unknown): number {
  const fallback = GENERAL_DEFAULTS.avg_response_minutes;
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampMinutes(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return clampMinutes(parsed);
    }
  }
  return fallback;
}

function clampMinutes(value: number): number {
  const bounded = Math.max(1, Math.min(240, Math.round(value)));
  return bounded;
}

async function syncLegacyConfig(sb: ReturnType<typeof supabaseAdmin>, payload: GeneralSettings) {
  await sb
    .from("admin_config")
    .upsert({ id: "default", ...payload }, { onConflict: "id" });
}
