import { NextResponse } from "next/server";

import { internalGuard } from "@/lib/internalAuth";

export const runtime = 'nodejs';

// Reindex posts into Meili (basic). Should be protected (TODO: auth check / token)
export async function POST(req: Request){
  if(!internalGuard(req)) return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 });
  // Stub ativo: meilisearch indisponível. Retorna noop.
  return NextResponse.json({ ok:true, meili:false, indexed:0, stub:true, note:'MeiliSearch desativado (stub). Reative reinstalando dependência.' });
}
