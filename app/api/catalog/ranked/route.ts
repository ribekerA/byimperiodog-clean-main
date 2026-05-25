import { NextResponse } from "next/server";

import { getRankedPuppies } from "@/lib/ai/catalog-ranking";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = {
    color: searchParams.get("color") || undefined,
    gender: searchParams.get("gender") || undefined,
    city: searchParams.get("city") || undefined,
    state: searchParams.get("state") || undefined,
    status: searchParams.get("status") || undefined,
  };

  try {
    const data = await getRankedPuppies(filters);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
