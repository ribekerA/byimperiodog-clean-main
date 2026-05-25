export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/reviews/[id]
 *       body: { status: "approved" | "rejected" }
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { status } = body;
  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "status deve ser 'approved' ou 'rejected'" }, { status: 400 });
  }

  try {
    const sb = supabaseAdmin();
    const { error } = await sb
      .from("puppy_reviews")
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[admin/reviews PATCH]", err);
    return NextResponse.json({ error: "Falha ao atualizar" }, { status: 500 });
  }
}
