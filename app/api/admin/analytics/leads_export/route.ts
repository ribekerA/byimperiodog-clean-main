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
  const days = parseInt(searchParams.get("days") || "14", 10);

  const fromTs = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString();
  // As colunas pedidas antes (first_name, last_name, phone, first_responded_at)
  // nao existem na tabela: o PostgREST recusava a query e o CSV so devolvia 500.
  // Alem dos campos reais, o export agora leva page_type e page_slug — e o que
  // responde "qual pagina gerou este lead" sem precisar cruzar com o GA4.
  const columns = [
    "id",
    "created_at",
    "nome",
    "telefone",
    "cidade",
    "estado",
    "source",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "page_type",
    "page_slug",
    "status",
  ];

  const { data: leads, error } = await supa()
    .from("leads")
    .select(columns.join(","))
    .gte("created_at", fromTs)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = columns;
  const csv = [header.join(",")]
    .concat((leads||[]).map(r => header.map(h => JSON.stringify((r as any)[h] ?? "")).join(","))).join("\n");

  return new NextResponse(csv, {
    headers: { "Content-Type":"text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads_${days}d.csv"` }
  });
}
