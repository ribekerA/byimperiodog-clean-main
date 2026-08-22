export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";

import { RequestBodyError, readJsonWithLimit } from "@/lib/requestGuards";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ZapSign envia um POST a cada mudança de status no documento.
// Autenticidade verificada via header customizado configurado no painel ZapSign
// (Configurações > Integrações > Api ZapSign > Webhooks > headers), não por HMAC do payload
// — a API do ZapSign não assina o corpo da requisição, apenas ecoa headers configurados por nós.
export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.ZAPSIGN_WEBHOOK_SECRET;
    if (!expectedSecret) {
      console.error("[webhook/zapsign] ZAPSIGN_WEBHOOK_SECRET não configurado — recusando requisição");
      return NextResponse.json({ ok: false, error: "webhook não configurado" }, { status: 500 });
    }
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ ok: false, error: "não autorizado" }, { status: 401 });
    }

    const body = await readJsonWithLimit(req, 256 * 1024);

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
    if (e instanceof RequestBodyError) {
      return NextResponse.json({ ok: false, error: e.code }, { status: e.status });
    }
    console.error("[webhook/zapsign]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
