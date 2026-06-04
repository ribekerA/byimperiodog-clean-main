export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ZapSign envia um POST a cada mudança de status no documento
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Estrutura do webhook ZapSign:
    // { token, status, external_id, signed_file, signers: [{ token, status, signed_at }] }
    const {
      token:       docToken,
      status:      docStatus,
      external_id: contractCode,
      signed_file: signedFileUrl,
    } = body as {
      token?:       string;
      status?:      string;
      external_id?: string;
      signed_file?: string;
    };

    if (!docToken && !contractCode) {
      return NextResponse.json({ ok: false, error: "token ou external_id ausente" }, { status: 400 });
    }

    const sb = supabaseAdmin();

    // Localiza o contrato pelo código (external_id) ou pelo token ZapSign
    let query = sb.from("contracts").select("id,code,status");
    if (contractCode) {
      query = query.eq("code", contractCode);
    } else {
      query = query.eq("zapsign_doc_token", docToken);
    }

    const { data: contract } = await query.maybeSingle();
    if (!contract) return NextResponse.json({ ok: true, message: "contrato não encontrado, ignorado" });

    const updates: Record<string, unknown> = {
      zapsign_status: docStatus ?? null,
      updated_at:     new Date().toISOString(),
    };

    // Documento completamente assinado
    if (docStatus === "finished") {
      updates.status        = "assinado";
      updates.signed_at     = new Date().toISOString();
      updates.signed_pdf_url = signedFileUrl ?? null;
    }

    // Documento cancelado
    if (docStatus === "canceled") {
      updates.zapsign_status = "canceled";
    }

    await sb
      .from("contracts")
      .update(updates as Parameters<ReturnType<typeof sb.from>["update"]>[0])
      .eq("id", contract.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[webhook/zapsign]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
