import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PuppyRow = {
  id: string;
  name?: string | null;
  slug?: string | null;
  status?: string | null;
  price_cents?: number | null;
  created_at?: string | null;
  color?: string | null;
  midia?: { url: string }[] | null;
};

type LeadRow = {
  id: string;
  created_at: string;
  status?: string | null;
  cor_preferida?: string | null;
  sexo_preferido?: string | null;
  page_slug?: string | null;
  page?: string | null;
  last_contact_at?: string | null;
};

export type Alerts = {
  critical: string[];
  medium: string[];
  low: string[];
};

function daysBetween(created?: string | null) {
  if (!created) return 0;
  return (Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24);
}

export async function generateOperationalAlerts(): Promise<Alerts> {
  const sb = supabaseAdmin();

  const [{ data: puppies }, { data: leads }] = await Promise.all([
    sb
      .from("puppies")
      .select("id,name,slug,status,price_cents,created_at,color,midia")
      .order("created_at", { ascending: false }),
    sb
      .from("leads")
      .select("id,created_at,status,cor_preferida,sexo_preferido,page_slug,page,last_contact_at")
      .gte("created_at", new Date(Date.now() - 120 * 86400 * 1000).toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const alerts: Alerts = { critical: [], medium: [], low: [] };
  const puppyLeadCount = new Map<string, number>();

  (leads ?? []).forEach((l: { page_slug?: string | null; page?: string | null }) => {
    const slug = (l.page_slug || l.page || "").toString();
    if (!slug) return;
    puppyLeadCount.set(slug, (puppyLeadCount.get(slug) ?? 0) + 1);
  });

  // Map estoque por cor para comparar com demanda
  const stockByColor = new Map<string, number>();
  (puppies ?? [])
    .filter((p: { status?: string | null }) => (p.status || "available") === "available")
    .forEach((p: { color?: string | null }) => {
      const c = (p.color || "desconhecida").toLowerCase();
      stockByColor.set(c, (stockByColor.get(c) ?? 0) + 1);
    });

  // Filhotes sem foto / sem preço / tempo de estoque
  (puppies ?? []).forEach((p: PuppyRow) => {
    if (!p.midia || p.midia.length === 0) alerts.medium.push(`Filhote sem foto: ${p.name || p.slug || p.id}`);
    if (!p.price_cents || p.price_cents <= 0) alerts.medium.push(`Filhote sem preço: ${p.name || p.slug || p.id}`);
    if (daysBetween(p.created_at) > 90 && (p.status || "available") === "available") {
      alerts.medium.push(`Filhote >90 dias no estoque: ${p.name || p.slug || p.id}`);
    }

    const leadHits = puppyLeadCount.get(p.slug || "") ?? 0;
    if (leadHits >= 20 && (p.status || "available") === "available") {
      alerts.critical.push(`Risco de overbooking: ${p.name || p.slug || p.id} com ${leadHits} leads.`);
    }
  });

  // Leads sem resposta >2h
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  (leads ?? []).forEach((l: LeadRow) => {
    const last = l.last_contact_at ? new Date(l.last_contact_at).getTime() : new Date(l.created_at).getTime();
    if ((!l.status || l.status === "novo") && last < twoHoursAgo) {
      alerts.medium.push(`Lead sem resposta >2h: ${l.id}`);
    }
  });

  // Demanda por cor > estoque
  const demandByColor = new Map<string, number>();
  (leads ?? []).forEach((l: LeadRow) => {
    const c = (l.cor_preferida || "desconhecida").toLowerCase();
    demandByColor.set(c, (demandByColor.get(c) ?? 0) + 1);
  });
  demandByColor.forEach((demand, color) => {
    const stock = stockByColor.get(color) ?? 0;
    if (demand >= stock * 2 && demand > 5) {
      alerts.critical.push(`Alta demanda x estoque baixo para cor ${color}: leads ${demand}, estoque ${stock}.`);
    } else if (demand > stock && demand > 3) {
      alerts.medium.push(`Demanda maior que estoque para cor ${color}: leads ${demand}, estoque ${stock}.`);
    }
  });

  // Compacta e remove duplicados
  alerts.critical = Array.from(new Set(alerts.critical));
  alerts.medium = Array.from(new Set(alerts.medium));
  alerts.low = Array.from(new Set(alerts.low));

  return alerts;
}
