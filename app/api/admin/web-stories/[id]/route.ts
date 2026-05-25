export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
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
