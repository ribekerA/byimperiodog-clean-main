export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimitRequest, tooManyRequests } from "@/lib/rateLimitDurable";
import { RequestBodyError, readFormDataWithLimit } from "@/lib/requestGuards";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const STORAGE_BUCKET = "contracts";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;
const MAX_MULTIPART_BYTES = 24 * 1024 * 1024;
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL || "byimperiodog@gmail.com";

const payloadSchema = z.object({
  nome:               z.string().trim().min(3).max(120),
  cpf:                z.string().trim().min(11).max(20),
  rg:                 z.string().trim().max(30).optional(),
  email:              z.string().trim().email().max(254).optional().or(z.literal("")),
  telefone:           z.string().trim().min(10).max(30),
  endereco:           z.string().trim().min(5).max(500),
  nascimento:         z.string().trim().max(20).optional(),
  nome_filhote:       z.string().trim().max(120).optional(),
  cor:                z.string().trim().max(80).optional(),
  sexo:               z.string().trim().max(30).optional(),
  nascimento_filhote: z.string().trim().max(20).optional(),
  ip_timestamp:       z.string().trim().max(100).optional(),
}).strict();

async function uploadFile(sb: ReturnType<typeof supabaseAdmin>, code: string, field: string, file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES) throw new Error(`Arquivo ${field} excede 10 MB`);
  const ext    = (file.name.split(".").pop() ?? "bin").replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "bin";
  const path   = `${code}/${field}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, buffer, { contentType: file.type, upsert: true });
  if (error) throw new Error(`Erro ao enviar ${field}: ${error.message}`);
  return path;
}

async function uploadSignature(sb: ReturnType<typeof supabaseAdmin>, code: string, dataUrl: string): Promise<string | null> {
  if (!dataUrl || !dataUrl.startsWith("data:image/png")) return null;
  const base64 = dataUrl.split(",")[1];
  if (!base64) return null;
  if (Math.floor(base64.length * 0.75) > MAX_SIGNATURE_BYTES) {
    throw new RequestBodyError("Assinatura excede 2 MB", { status: 413, code: "payload_too_large" });
  }
  const buffer = Buffer.from(base64, "base64");
  const path   = `${code}/assinatura.png`;
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, buffer, { contentType: "image/png", upsert: true });
  if (error) return null;
  return path;
}

export async function POST(req: NextRequest) {
  const rate = await rateLimitRequest(req, { scope: "contract-submit", limit: 10, windowMs: 10 * 60_000 });
  if (!rate.allowed) return tooManyRequests(rate, "Muitas tentativas. Tente novamente em alguns minutos.");

  try {
    const form       = await readFormDataWithLimit(req, MAX_MULTIPART_BYTES);
    const code       = String(form.get("code") ?? "").trim();
    const rawPayload = form.get("payload");
    const signatureDataUrl = String(form.get("signature") ?? "");

    if (!code || code.length > 64) return NextResponse.json({ error: "Código do contrato ausente ou inválido" }, { status: 400 });
    if (String(rawPayload ?? "").length > 32 * 1024) {
      return NextResponse.json({ error: "Payload do contrato excede o limite" }, { status: 413 });
    }

    let buyerData: z.infer<typeof payloadSchema>;
    try {
      const result = payloadSchema.safeParse(JSON.parse(String(rawPayload ?? "{}")));
      if (!result.success) return NextResponse.json({ error: "Dados inválidos", details: result.error.errors }, { status: 400 });
      buyerData = result.data;
    } catch {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const sb = supabaseAdmin();

    const { data: contract, error: findErr } = await sb
      .from("contracts")
      .select("id,code,status")
      .eq("code", code)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!contract) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    if (contract.status === "assinado") return NextResponse.json({ error: "Este contrato já foi assinado" }, { status: 409 });

    const hemogramaFile = form.get("hemograma") as File | null;
    const laudoFile     = form.get("laudo")     as File | null;

    const [hemogramaPath, laudoPath, signaturePath] = await Promise.all([
      hemogramaFile instanceof File ? uploadFile(sb, code, "hemograma", hemogramaFile) : null,
      laudoFile     instanceof File ? uploadFile(sb, code, "laudo",     laudoFile)     : null,
      signatureDataUrl               ? uploadSignature(sb, code, signatureDataUrl)      : null,
    ]);

    if (!signaturePath) return NextResponse.json({ error: "Assinatura obrigatória" }, { status: 422 });

    const { error: updateErr } = await sb
      .from("contracts")
      .update({
        payload:        buyerData,
        hemograma_path: hemogramaPath ?? undefined,
        laudo_path:     laudoPath     ?? undefined,
        signature_path: signaturePath,
        status:         "assinado",
        signed_at:      new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      } as Parameters<ReturnType<typeof sb.from>["update"]>[0])
      .eq("id", contract.id);

    if (updateErr) throw updateErr;

    // Notifica a criadora (opcional — requer RESEND_API_KEY)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(10_000),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from:    `By Império Dog <noreply@byimperiodog.com.br>`,
          to:      [ADMIN_EMAIL],
          subject: `✅ Contrato ${code} assinado — ${buyerData.nome}`,
          html:    `<p>O comprador <strong>${buyerData.nome}</strong> assinou o contrato <code>${code}</code>.</p><p>Filhote: ${buyerData.nome_filhote ?? "—"} (${buyerData.cor ?? "—"} ${buyerData.sexo ?? "—"})</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/contract/${code}/documento">Ver documento completo</a></p>`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof RequestBodyError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[contract/POST]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
