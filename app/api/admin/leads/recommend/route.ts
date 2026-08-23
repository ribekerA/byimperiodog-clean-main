import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { recommendPuppiesForLead } from "@/lib/puppyRecommender";

export async function POST(req: Request) {
  const guard = requireAdmin(req);
  if (guard) return guard;

  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 });

  try {
    const rec = await recommendPuppiesForLead(leadId);
    return NextResponse.json({ ok: true, recommendation: rec });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
