export type GeneralSettings = {
  brand_name: string;
  brand_tagline: string;
  contact_email: string;
  contact_phone: string;
  instagram: string;
  tiktok: string;
  whatsapp_message: string;
  template_first_contact: string;
  template_followup: string;
  followup_rules: string;
  avg_response_minutes: number;
  seo_title_default: string;
  seo_description_default: string;
  seo_meta_tags: string;
};

export const GENERAL_DEFAULTS: GeneralSettings = {
  brand_name: "By Império Dog",
  brand_tagline: "Curadoria premium de Spitz Alemão",
  contact_email: "",
  contact_phone: "",
  instagram: "",
  tiktok: "",
  whatsapp_message:
    "Oi! Eu vi seu interesse nos filhotes da By Império Dog. Como posso te ajudar a escolher o Spitz ideal?",
  template_first_contact:
    "Olá, vi sua mensagem sobre Spitz. Posso te mostrar fotos/vídeo e opções de cores e entregas.",
  template_followup: "Tudo bem? Ainda tem interesse no Spitz? Posso esclarecer dúvidas ou ajustar o valor/entrega.",
  followup_rules: "Responder em até 30 min; 2 follow-ups em 24h; oferta expira em 48h.",
  avg_response_minutes: 30,
  seo_title_default: "By Império Dog • Spitz Alemão Anão (Lulu da Pomerânia)",
  seo_description_default:
    "Filhotes de Spitz Alemão Anão com curadoria premium, saúde garantida e entrega segura. Veja cores, preços e vídeos.",
  seo_meta_tags: "spitz, lulu da pomerânia, filhotes, criação responsável",
};

export type GeneralTextField = Exclude<keyof GeneralSettings, "avg_response_minutes">;

export const GENERAL_TEXT_FIELDS: GeneralTextField[] = [
  "brand_name",
  "brand_tagline",
  "contact_email",
  "contact_phone",
  "instagram",
  "tiktok",
  "whatsapp_message",
  "template_first_contact",
  "template_followup",
  "followup_rules",
  "seo_title_default",
  "seo_description_default",
  "seo_meta_tags",
];

export const GENERAL_SETTINGS_COLUMNS = [
  "brand_name",
  "brand_tagline",
  "contact_email",
  "contact_phone",
  "instagram",
  "tiktok",
  "whatsapp_message",
  "template_first_contact",
  "template_followup",
  "followup_rules",
  "avg_response_minutes",
  "seo_title_default",
  "seo_description_default",
  "seo_meta_tags",
] as const;

export const GENERAL_COLUMN_SELECT = GENERAL_SETTINGS_COLUMNS.join(",");

export function applyGeneralDefaults(snapshot?: Partial<GeneralSettings> | null): GeneralSettings {
  const base: GeneralSettings = { ...GENERAL_DEFAULTS };
  if (!snapshot) return base;
  const next = { ...base };
  GENERAL_TEXT_FIELDS.forEach((field) => {
    const value = snapshot[field];
    if (typeof value === "string" && value.trim().length > 0) {
      next[field] = value;
    }
  });
  if (typeof snapshot.avg_response_minutes === "number" && Number.isFinite(snapshot.avg_response_minutes)) {
    next.avg_response_minutes = snapshot.avg_response_minutes;
  }
  return next;
}
