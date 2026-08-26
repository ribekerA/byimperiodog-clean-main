export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const autorizacao = requireAdminApi(request);
  if (autorizacao) return autorizacao;

  const params = await props.params;
  try {
    const supabase = supabaseAdmin();
    const { id } = params;

    const { error } = await supabase.from("web_stories").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting web story:", error);
    return NextResponse.json(
      { error: "Falha ao excluir Web Story" },
      { status: 500 }
    );
  }
}
