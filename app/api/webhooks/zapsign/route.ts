export const dynamic = "force-dynamic";

import { timingSafeEqual } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { erroPublico } from "@/lib/apiErro";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MAX_BODY_BYTES = 512 * 1024;
const payloadSchema = z.object({
  token: z.string().trim().min(1).max(300).optional(),
  status: z.string().trim().min(1).max(60).optional(),
  external_id: z.string().trim().regex(/^[A-F0-9]{12,32}$/i).optional(),
  signed_file: z.string().url().max(2048).refine((value) => new URL(value).protocol === "https:").optional(),
}).passthrough().refine((body) => Boolean(body.token || body.external_id));

function bearerMatches(header: string | null, secret: string): boolean {
  if (!header || secret.length < 32) return false;
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const received = Buffer.from(header, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

// ZapSign ecoa um header secreto configurado no painel. Como o corpo não vem
// assinado pelo provedor, o segredo deve ser longo, exclusivo e comparado em
// tempo constante.
export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.ZAPSIGN_WEBHOOK_SECRET?.trim() || "";
    if (expectedSecret.length < 32) {
      console.error("[webhook/zapsign] segredo ausente ou fraco; requisição recusada");
      return NextResponse.json({ ok: false, error: "webhook indisponível" }, { status: 503 });
    }
    if (!bearerMatches(req.headers.get("authorization"), expectedSecret)) {
      return NextResponse.json({ ok: false, error: "não autorizado" }, { status: 401 });
    }

    const declaredLength = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "payload grande demais" }, { status: 413 });
    }
    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "payload grande demais" }, { status: 413 });
    }
    const parsedJson = (() => { try { return JSON.parse(rawBody); } catch { return null; } })();
    const parsed = payloadSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "payload inválido" }, { status: 400 });
    }

    const {
      token: docToken,
      status: docStatus,
      external_id: contractCode,
      signed_file: signedFileUrl,
    } = parsed.data;
    const sb = supabaseAdmin();
    let query = sb.from("contracts").select("id,code,status,zapsign_status");
    query = contractCode ? query.eq("code", contractCode) : query.eq("zapsign_doc_token", docToken!);

    const { data: contract, error: lookupError } = await query.maybeSingle();
    if (lookupError) throw lookupError;
    if (!contract) return NextResponse.json({ ok: true });

    if (docStatus === "finished" && contract.status === "assinado" && contract.zapsign_status === "finished") {
      return NextResponse.json({ ok: true });
    }

    const updates: Record<string, unknown> = {
      zapsign_status: docStatus ?? null,
      updated_at: new Date().toISOString(),
    };
    if (docStatus === "finished") {
      updates.status = "assinado";
      updates.signed_at = new Date().toISOString();
      updates.signed_pdf_url = signedFileUrl ?? null;
    }

    const { error: updateError } = await sb
      .from("contracts")
      .update(updates as Parameters<ReturnType<typeof sb.from>["update"]>[0])
      .eq("id", contract.id);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return erroPublico("api/webhooks/zapsign", error);
  }
}
