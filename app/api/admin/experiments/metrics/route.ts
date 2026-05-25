import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { analyticsRepo } from "@/lib/db";

type VariantMetrics = {
  variant: string;
  views: number;
  conversions: number;
  conversionRate: number;
};

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "missing-key" }, { status: 400 });
  }

  // Buscar eventos de visualização e conversão por variante
  // Formato esperado no meta: { experiment: key, variant: variantKey }
  const allEvents = await analyticsRepo.listEvents({ limit: 10000 });
  const filtered = allEvents.items.filter((ev) => {
    const meta = ev.meta as Record<string, unknown> | null;
    return meta && meta.experiment === key;
  });

  const variantMap: Record<string, { views: number; conversions: number }> = {};

  for (const ev of filtered) {
    const meta = ev.meta as Record<string, unknown> | null;
    const variant = (meta?.variant as string) || "unknown";
    if (!variantMap[variant]) variantMap[variant] = { views: 0, conversions: 0 };
    if (ev.name === "experiment_view") {
      variantMap[variant].views += 1;
    } else if (ev.name === "experiment_conversion") {
      variantMap[variant].conversions += 1;
    }
  }

  const metrics: VariantMetrics[] = Object.entries(variantMap).map(([variant, stats]) => ({
    variant,
    views: stats.views,
    conversions: stats.conversions,
    conversionRate: stats.views > 0 ? (stats.conversions / stats.views) * 100 : 0,
  }));

  return NextResponse.json({ metrics });
}
