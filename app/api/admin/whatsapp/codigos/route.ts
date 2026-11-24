export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { buscarCodigo, marcarVenda } from "@/lib/admin/whatsappRefs";
import { logAdminAction, requireAdmin } from "@/lib/adminAuth";
import { corpoJson } from "@/lib/limitePublico";
import { hasServiceRoleKey } from "@/lib/supabaseAdmin";
import { codigoDigitado } from "@/lib/whatsapp-ref";

// Códigos curtos do WhatsApp no dashboard (ver src/lib/admin/whatsappRefs.ts).
// GET procura um código; POST marca ou desmarca a venda. Marcar venda só grava
// a hora no banco: nada vai para o Google Ads.

function semBanco() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !hasServiceRoleKey();
}

export async function GET(req: NextRequest) {
  const guard = requireAdmin(req, { permission: "dashboard:read" });
  if (guard) return guard;
  if (semBanco()) return NextResponse.json({ error: "O painel não está ligado ao banco de dados." }, { status: 503 });

  const ref = codigoDigitado(req.nextUrl.searchParams.get("ref") ?? "");
  if (!ref) return NextResponse.json({ error: "Isso não parece um código. Ele tem 5 letras e números, como K7M2Q." }, { status: 400 });

  try {
    const { codigo, vendaDisponivel } = await buscarCodigo(ref);
    if (!codigo) return NextResponse.json({ error: `O código ${ref} não está no banco.`, ref }, { status: 404 });
    return NextResponse.json({ codigo, vendaDisponivel });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao buscar." }, { status: 500 });
  }
}

const corpoSchema = z
  .object({
    ref: z.string().trim().min(1).max(40),
    vendido: z.boolean(),
    valor: z.number().positive().max(1_000_000).nullable().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const guard = requireAdmin(req, { permission: "cadastros:write" });
  if (guard) return guard;
  if (semBanco()) return NextResponse.json({ error: "O painel não está ligado ao banco de dados." }, { status: 503 });

  const lido = await corpoJson<unknown>(req, 2 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = corpoSchema.safeParse(lido.dados);
  const ref = parsed.success ? codigoDigitado(parsed.data.ref) : null;
  if (!parsed.success || !ref) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  try {
    const valor = parsed.data.valor == null ? null : Math.round(parsed.data.valor * 100) / 100;
    const resultado = await marcarVenda(ref, parsed.data.vendido, valor);
    if (resultado === "sem_coluna") {
      return NextResponse.json(
        { error: "Falta rodar o SQL 20261118160000_whatsapp_refs_venda.sql no banco para marcar venda." },
        { status: 409 },
      );
    }
    if (!resultado) return NextResponse.json({ error: `O código ${ref} não está no banco.` }, { status: 404 });
    await logAdminAction({
      route: "/api/admin/whatsapp/codigos",
      method: "POST",
      action: parsed.data.vendido ? "whatsapp_ref_venda" : "whatsapp_ref_venda_desfeita",
      payload: { ref },
    });
    return NextResponse.json({ codigo: resultado });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao gravar." }, { status: 500 });
  }
}
