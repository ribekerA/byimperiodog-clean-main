import { supabaseAdmin } from "@/lib/supabaseAdmin";

type PuppyRow = {
  id: string;
  slug?: string | null;
  name?: string | null;
  status?: string | null;
  price_cents?: number | null;
  created_at?: string | null;
  color?: string | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  [key: string]: unknown;
};

type LeadAgg = { slug: string; count: number };

export type RankedPuppy = PuppyRow & {
  score: number;
  flag: "hot" | "normal" | "slow";
  reason: string;
  leadCount?: number;
};

function daysBetween(created?: string | null) {
  if (!created) return 0;
  return (Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24);
}

function normalize(value: number, max: number, cap = 1) {
  if (max <= 0) return 0;
  return Math.min(value / max, cap);
}

function buildReason(parts: string[]) {
  return parts.filter(Boolean).slice(0, 3).join(" · ");
}

export async function recalcCatalogRanking() {
  const sb = supabaseAdmin();

  const [puppiesRes, leadsAggRes] = await Promise.all([
    sb
      .from("puppies")
      .select("id,slug,name,status,price_cents,created_at,color,gender,city,state")
      .or("status.eq.available,status.eq.reserved"),
    sb
      .from("leads")
      .select("page_slug, count:page_slug", { head: false, group: "page_slug" }),
  ]);

  const puppies = (puppiesRes.data ?? []) as PuppyRow[];
  const leadsAgg = (leadsAggRes.data ?? [])
    .filter((l: any) => l.page_slug)
    .map((l: any) => ({ slug: l.page_slug as string, count: Number(l.count) || 0 })) as LeadAgg[];

  const maxLeads = leadsAgg.reduce((m, l) => Math.max(m, l.count), 0);

  const scored = puppies.map((p) => {
    let score = 50;
    const reasons: string[] = [];

    const leadCount =
      leadsAgg.find((l) => l.slug === p.slug)?.count ??
      leadsAgg.find((l) => l.slug === `filhotes/${p.slug}`)?.count ??
      0;
    if (leadCount > 0) {
      const leadBoost = normalize(leadCount, maxLeads || leadCount, 1) * 30;
      score += leadBoost;
      reasons.push(`Demanda (${leadCount} leads)`);
    }

    const age = daysBetween(p.created_at);
    if (age <= 30) {
      score += 10;
      reasons.push("Recente");
    } else if (age >= 90) {
      score -= 15;
      reasons.push("Estoque antigo");
    }

    if ((p.status || "available") === "reserved") {
      score -= 20;
      reasons.push("Reservado");
    }

    const price = p.price_cents || 0;
    if (price > 0) {
      const isPremium = price > 800000; // R$8.000 como referência simples
      if (isPremium) reasons.push("Premium");
    }

    const flag: RankedPuppy["flag"] = score >= 75 ? "hot" : score < 40 ? "slow" : "normal";

    return {
      ...p,
      score: Math.round(Math.max(0, Math.min(score, 100))),
      flag,
      reason: buildReason(reasons),
      leadCount,
    };
  });

  // Ordenar e aplicar rank_order
  scored.sort((a, b) => b.score - a.score || daysBetween(a.created_at) - daysBetween(b.created_at));

  const rows = scored.map((p, idx) => ({
    puppy_id: p.id,
    score: p.score,
    flag: p.flag,
    reason: p.reason,
    rank_order: idx + 1,
  }));

  if (rows.length > 0) {
    await sb.from("catalog_ranking").upsert(rows, { onConflict: "puppy_id" });
  }

  return { total: rows.length };
}

const normalizeStatus = (value?: string | string[]) => {
  if (!value) return ["disponivel", "reservado"];
  const list = Array.isArray(value) ? value : [value];
  const map: Record<string, string> = {
    available: "disponivel",
    reserved: "reservado",
    sold: "vendido",
  };
  return list
    .map((status) => status?.toLowerCase())
    .map((status) => map[status] || status)
    .filter((status): status is string => Boolean(status));
};

export async function getRankedPuppies(filters?: {
  color?: string;
  gender?: string;
  city?: string;
  state?: string;
  status?: string | string[];
  limit?: number;
}) {
  const sb = supabaseAdmin();
  const statuses = normalizeStatus(filters?.status);

  let query = sb
    .from("puppies")
    .select("*, catalog_ranking(score,flag,reason,rank_order)")
    .order("rank_order", { referencedTable: "catalog_ranking", ascending: true })
    .order("score", { referencedTable: "catalog_ranking", ascending: false })
    .order("created_at", { ascending: false });

  if (statuses.length === 1) {
    query = query.eq("status", statuses[0]);
  } else if (statuses.length > 1) {
    query = query.in("status", statuses);
  }

  if (filters?.color) query = query.eq("color", filters.color);
  if (filters?.gender) query = query.eq("gender", filters.gender);
  if (filters?.city) query = query.eq("city", filters.city);
  if (filters?.state) query = query.eq("state", filters.state);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    ...row,
    score: row.catalog_ranking?.score ?? 0,
    flag: (row.catalog_ranking?.flag ?? "normal") as RankedPuppy["flag"],
    reason: row.catalog_ranking?.reason ?? "",
  })) as RankedPuppy[];
}
