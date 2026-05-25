import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const code = String(form.get("code") || "");
    const payload = JSON.parse(String(form.get("payload") || "{}"));
    const hemograma = form.get("hemograma") as File | null;
    const laudo = form.get("laudo") as File | null;

    const sb = supabaseAdmin();

    // localiza contrato pelo code
    const { data: contract, error: e1 } = await sb
      .from("contracts")
      .select("id")
      .eq("code", code)
      .single();

    if (e1 || !contract) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    }

    // uploads (opcional)
    const uploads: { hemograma_path?: string; laudo_path?: string } = {};

    const up = async (file: File | null, key: string) => {
      if (!file) return;
      const path = `c_${contract.id}/${Date.now()}_${key}.${(file.type.split("/")[1] || "bin")}`;
      const { error } = await sb.storage.from("contracts").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      (uploads as any)[`${key}_path`] = path;
    };

    await up(hemograma, "hemograma");
    await up(laudo, "laudo");

    const { error: e2 } = await sb
      .from("contracts")
      .update({ payload, ...uploads })
      .eq("id", contract.id);

    if (e2) return NextResponse.json({ error: e2.message }, { status: 400 });

    return NextResponse.json({ ok: true, id: contract.id, ...uploads });
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
