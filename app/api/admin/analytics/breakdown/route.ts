export const dynamic = "force-dynamic";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";

const supa = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

// A conferencia daqui era `admin_auth === "1"` -- cookie sem assinatura, que
// qualquer pessoa digita no proprio navegador. Nao virava invasao porque o
// proxy confere a sessao assinada antes de chegar aqui, mas era seguranca de
// mentira: bastava a rota sair de baixo do matcher para ficar nua. Passa a
// usar o mesmo guard das outras 104 rotas administrativas.

export async function GET(req: NextRequest) {
  const autorizacao = requireAdminApi(req);
  if (autorizacao) return autorizacao;
  const { searchParams } = new URL(req.url);
  const tz = searchParams.get("tz") || "America/Sao_Paulo";
  const days = parseInt(searchParams.get("days") || "14", 10);
  const by = (searchParams.get("by") || "source") as "source" | "campaign";
  const source = searchParams.get("source") || null;

  const fn = by === "source" ? "source_breakdown_v1" : "campaign_breakdown_v1";
  const args: any = by === "source" ? { tz, days } : { tz, days, source };

  const { data, error } = await supa().rpc(fn, args);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data });
}
