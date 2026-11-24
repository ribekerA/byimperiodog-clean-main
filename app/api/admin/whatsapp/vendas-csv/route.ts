export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { listarVendasMarcadas } from "@/lib/admin/whatsappRefs";
import { montarCsvDeVendas, separarVendasParaExport } from "@/lib/admin/whatsappVendasCsv";
import { requireAdmin } from "@/lib/adminAuth";
import { hasServiceRoleKey } from "@/lib/supabaseAdmin";

// Export das vendas marcadas no painel para o Google Ads ("Importar de cliques").
// Só leitura: nada é enviado ao Google. Por padrão, vendas dos últimos 90 dias.
// Cada download traz todas as vendas da janela; a deduplicação fica por conta do Google.

const DIAS_PADRAO = 90;
const DIAS_MAXIMO = 90;

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req, { permission: "dashboard:read" });
  if (guard) return guard;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !hasServiceRoleKey()) {
    return NextResponse.json({ error: "O painel não está ligado ao banco de dados." }, { status: 503 });
  }

  const pedidos = Number(req.nextUrl.searchParams.get("dias") ?? DIAS_PADRAO);
  const dias = Number.isInteger(pedidos) && pedidos > 0 ? Math.min(pedidos, DIAS_MAXIMO) : DIAS_PADRAO;

  try {
    const vendas = await listarVendasMarcadas(dias);
    const { exportaveis, semGclid, semValor } = separarVendasParaExport(vendas);
    const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    return new NextResponse(montarCsvDeVendas(exportaveis), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="vendas-whatsapp-google-ads-${hoje}.csv"`,
        "cache-control": "no-store",
        "x-vendas-exportadas": String(exportaveis.length),
        "x-vendas-sem-gclid": String(semGclid),
        "x-vendas-sem-valor": String(semValor),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao exportar." }, { status: 500 });
  }
}
