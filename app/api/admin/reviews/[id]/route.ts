export const dynamic = "force-dynamic";

/**
 * PATCH  /api/admin/reviews/[id]   body: { approved: boolean }
 * DELETE /api/admin/reviews/[id]   exclui a avaliação (é o "recusar": o banco não guarda estado de recusada)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/adminAuth";
import { corpoJson } from "@/lib/limitePublico";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const idSchema = z.string().uuid();
const patchSchema = z.object({ approved: z.boolean() });

type Props = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, props: Props) {
  const autorizacao = requireAdminApi(req);
  if (autorizacao) return autorizacao;

  const id = idSchema.safeParse((await props.params).id);
  if (!id.success) return NextResponse.json({ ok: false, error: "Avaliação inválida" }, { status: 400 });

  const body = await corpoJson<unknown>(req);
  if (body.resposta) return body.resposta;
  const parsed = patchSchema.safeParse(body.dados);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Informe se a avaliação fica aprovada ou não" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("puppy_reviews")
    .update({ approved: parsed.data.approved, updated_at: new Date().toISOString() } as Parameters<ReturnType<typeof sb.from>["update"]>[0])
    .eq("id", id.data)
    .select("id");

  if (error) {
    console.error("[admin/reviews] falha ao atualizar", { code: (error as { code?: string }).code ?? "erro" });
    return NextResponse.json({ ok: false, error: "Não foi possível atualizar a avaliação" }, { status: 500 });
  }
  if (!data || data.length === 0) return NextResponse.json({ ok: false, error: "Avaliação não encontrada" }, { status: 404 });

  return NextResponse.json({ ok: true, approved: parsed.data.approved });
}

export async function DELETE(req: NextRequest, props: Props) {
  const autorizacao = requireAdminApi(req);
  if (autorizacao) return autorizacao;

  const id = idSchema.safeParse((await props.params).id);
  if (!id.success) return NextResponse.json({ ok: false, error: "Avaliação inválida" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data, error } = await sb.from("puppy_reviews").delete().eq("id", id.data).select("id");

  if (error) {
    console.error("[admin/reviews] falha ao excluir", { code: (error as { code?: string }).code ?? "erro" });
    return NextResponse.json({ ok: false, error: "Não foi possível excluir a avaliação" }, { status: 500 });
  }
  if (!data || data.length === 0) return NextResponse.json({ ok: false, error: "Avaliação não encontrada" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
