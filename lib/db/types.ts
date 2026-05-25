/**
 * Tipos fortes do contrato Supabase usados pelo /admin.
 * Ajuste aqui sempre que o schema mudar para manter as páginas alinhadas.
 */

export type TimestampString = string; // ISO UTC

export type PuppyStatus = "available" | "reserved" | "sold" | "disponivel" | "reservado" | "vendido" | "pending";

export type PuppyRow = {
  id: string;
  slug: string;
  name: string;
  codigo?: string | null;
  gender: "male" | "female";
  status: PuppyStatus;
  color: string;
  price_cents: number | null;
  descricao?: string | null;
  notes?: string | null;
  city?: string | null;
  state?: string | null;
  birth_date?: TimestampString | null;
  ready_for_adoption_date?: TimestampString | null;
  image_url?: string | null;
  video_url?: string | null;
  midia?: Array<{ url?: string | null; type?: string | null }> | null;
  created_at: TimestampString;
  updated_at?: TimestampString | null;
  published_at?: TimestampString | null;
  sold_at?: TimestampString | null;
  reserved_at?: TimestampString | null;
  reservation_expires_at?: TimestampString | null;
  vaccination_dates?: TimestampString[] | null;
  next_vaccination_date?: TimestampString | null;
};

export type LeadStatus = "novo" | "em_contato" | "fechado" | "perdido" | string;

export type LeadRow = {
  id: string;
  nome?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  status?: LeadStatus | null;
  page?: string | null;
  page_slug?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referer?: string | null;
  mensagem?: string | null;
  notes?: string | null;
  created_at: TimestampString;
  updated_at?: TimestampString | null;
};

export type AdminUserRow = {
  id: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer" | string;
  name?: string | null;
  active: boolean;
  last_login_at?: TimestampString | null;
  created_at: TimestampString;
};

export type TrackingSettingsRow = {
  id: string; // use "default"
  gtm_id?: string | null;
  ga4_id?: string | null;
  meta_pixel_id?: string | null;
  tiktok_pixel_id?: string | null;
  pinterest_tag_id?: string | null;
  hotjar_id?: string | null;
  clarity_id?: string | null;
  custom_pixels?: { name: string; id: string }[] | null;
  updated_at?: TimestampString | null;
};

export type AdminConfigRow = {
  id: string; // "default"
  brand_name?: string | null;
  brand_tagline?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  whatsapp_message?: string | null;
  template_first_contact?: string | null;
  template_followup?: string | null;
  followup_rules?: string | null;
  avg_response_minutes?: number | null;
  seo_title_default?: string | null;
  seo_description_default?: string | null;
  seo_meta_tags?: string | null;
  updated_at?: TimestampString | null;
};

export type LeadInteractionRow = {
  id: string;
  lead_id: string;
  response_time_minutes?: number | null;
  messages_sent?: number | null;
  created_at: TimestampString;
};

export type CatalogAiEventRow = {
  id: string;
  event_type: string;
  puppy_id?: string | null;
  badge?: string | null;
  ctr_before?: number | null;
  ctr_after?: number | null;
  created_at: TimestampString;
};
