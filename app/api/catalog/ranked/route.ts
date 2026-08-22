import { NextResponse } from "next/server";
import { z } from "zod";

import { getRankedPuppies } from "@/lib/ai/catalog-ranking";
import { rateLimitRequestMemory, tooManyRequests } from "@/lib/rateLimitDurable";

const filtersSchema = z.object({
  color: z.string().trim().max(80).optional(),
  gender: z.string().trim().max(30).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(2).optional(),
  status: z.string().trim().max(30).optional(),
});

export async function GET(request: Request) {
  const rate = rateLimitRequestMemory(request, { scope: "catalog-ranked", limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return tooManyRequests(rate);

  const { searchParams } = new URL(request.url);
  const parsed = filtersSchema.safeParse({
    color: searchParams.get("color") || undefined,
    gender: searchParams.get("gender") || undefined,
    city: searchParams.get("city") || undefined,
    state: searchParams.get("state") || undefined,
    status: searchParams.get("status") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Filtros inválidos" }, { status: 400 });
  const filters = parsed.data;

  try {
    const data = await getRankedPuppies(filters);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
