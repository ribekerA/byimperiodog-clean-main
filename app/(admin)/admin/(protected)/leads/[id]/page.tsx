import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildLeadAdvisor } from "@/lib/ai/leadAdvisor";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

import { LeadDetailClient, type LeadDetailData, type LeadHistoryEntry } from "../LeadDetailClient";
import type { LeadPuppyMatch } from "../queries";
import { normalizeLeadStatus } from "../queries";
import { AdminErrorState } from "@/components/admin/ui/AdminErrorState";

export const metadata: Metadata = {
  title: "Lead | Admin",
  robots: { index: false, follow: false },
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const logger = createLogger("admin:lead-detail");
  const sb = supabaseAdmin();
  let data: any = null;
  let error: any = null;
  try {
    const res = await sb
      .from("leads")
      .select("*, lead_ai_insights!left(*)")
      .eq("id", params.id)
      .maybeSingle();
    data = res.data;
    error = res.error;
  } catch (err) {
    error = err;
  }

  if (error) {
    logger.error("Erro ao carregar lead", { error });
    return <AdminErrorState title="Erro ao carregar lead" message="Nao foi possivel abrir este lead agora." actionHref="/admin/leads" />;
  }
  if (!data) notFound();

  let logsData: any[] | null = null;
  try {
    const { data: logs } = await sb
      .from("autosales_logs")
      .select("id,created_at,status,message_type,content,cta_link,sequence_id")
      .eq("lead_id", params.id)
      .order("created_at", { ascending: false })
      .limit(25);
    logsData = logs ?? [];
  } catch (err) {
    logger.error("Erro ao buscar historico do lead", { err });
  }

  const matchedId = (data as any).puppy_id ?? data.lead_ai_insights?.matched_puppy_id ?? null;
  let matchedPuppy: LeadPuppyMatch | null = null;
  if (matchedId) {
    const { data: puppyRow } = await sb
      .from("puppies")
      .select("id,nome,name,slug,color,cor,sex,sexo,gender,price_cents,status,image_url,images,midia")
      .eq("id", matchedId)
      .maybeSingle();
    if (puppyRow) {
      matchedPuppy = {
        id: puppyRow.id,
        name: (puppyRow as any).nome ?? puppyRow.name ?? "Filhote",
        slug: puppyRow.slug ?? null,
        color: (puppyRow as any).color ?? (puppyRow as any).cor ?? null,
        sex: (puppyRow as any).sex ?? (puppyRow as any).sexo ?? (puppyRow as any).gender ?? null,
        priceCents: puppyRow.price_cents ?? null,
        status: puppyRow.status,
        imageUrl: selectCover(puppyRow as any),
      };
    }
  }

  const lead: LeadDetailData = {
    id: data.id,
    name: (data as any).nome ?? (data as any).first_name ?? "Lead",
    phone: (data as any).telefone ?? (data as any).phone ?? null,
    whatsapp: normalizePhone((data as any).telefone ?? (data as any).phone ?? null),
    city: (data as any).cidade ?? (data as any).city ?? null,
    state: (data as any).estado ?? (data as any).state ?? null,
    preferredColor: (data as any).cor_preferida ?? (data as any).preferencia ?? null,
    preferredSex: (data as any).sexo_preferido ?? null,
    status: normalizeLeadStatus(data.status as string),
    createdAt: data.created_at,
    updatedAt: (data as any).updated_at ?? null,
    page: (data as any).page_slug ?? data.page ?? null,
    origin: (data as any).utm_campaign ?? data.utm_source ?? data.utm_medium ?? data.source ?? null,
    message: (data as any).mensagem ?? null,
    notes: data.notes ?? null,
  };

  const history: LeadHistoryEntry[] = (logsData ?? []).map((entry) => ({
    id: entry.id,
    createdAt: entry.created_at,
    status: entry.status,
    type: entry.message_type,
    preview: truncate(entry.content, 200),
    ctaLink: entry.cta_link ?? null,
  }));

  const advisor = buildLeadAdvisor({
    id: data.id,
    name: lead.name,
    status: data.status,
    city: lead.city,
    state: lead.state,
    preferredColor: lead.preferredColor,
    preferredSex: lead.preferredSex,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    message: lead.message ?? lead.notes ?? null,
    aiScore: data.lead_ai_insights?.score ?? null,
    aiIntent: data.lead_ai_insights?.intent ?? null,
    aiUrgency: data.lead_ai_insights?.urgency ?? null,
    matchedPuppy,
    suggestedPuppies: Array.isArray(data.lead_ai_insights?.suggested_puppies)
      ? data.lead_ai_insights!.suggested_puppies!.map((item: any, index: number) => ({
          id: item?.puppy_id || `${data.id}-suggestion-${index}`,
          name: item?.name ?? "Filhote",
          reason: item?.reason ?? null,
          color: item?.color ?? null,
          sex: item?.sex ?? null,
        }))
      : [],
  });

  try {
    return <LeadDetailClient lead={lead} history={history} matchedPuppy={matchedPuppy} insight={data.lead_ai_insights as any} advisor={advisor} />;
  } catch (err) {
    logger.error("Erro ao montar tela de detalhes do lead", { err });
    return <AdminErrorState title="Erro ao carregar lead" message="Nao conseguimos carregar os detalhes agora. Tente novamente." actionHref="/admin/leads" />;
  }
}

const normalizePhone = (phone?: string | null) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits || null;
};

const truncate = (value?: string | null, limit = 200) => {
  if (!value) return value ?? null;
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
};

const selectCover = (row: any): string | null => {
  if (row.image_url) return row.image_url;
  if (Array.isArray(row.images) && row.images.length) {
    const first = row.images[0];
    if (typeof first === "string") return first;
    if (first?.url) return first.url as string;
  }
  if (Array.isArray(row.midia)) {
    const entry = row.midia.find((item: any) => item?.type === "image" && typeof item.url === "string");
    if (entry) return entry.url as string;
    const fallback = row.midia.find((item: any) => typeof item?.url === "string");
    if (fallback) return fallback.url as string;
  }
  return null;
};
