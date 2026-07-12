export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { rateLimit } from "@/lib/rateLimit";

const STORAGE_BUCKET = "contracts";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL || "byimperiodog@gmail.com";

const payloadSchema = z.object({
  nome:               z.string().min(3),
  cpf:                z.string().min(11),
  rg:                 z.string().optional(),
  email:              z.string().email().optional().or(z.literal("")),
  telefone:           z.string().min(10),
  endereco:           z.string().min(5),
  nascimento:         z.string().optional(),
  nome_filhote:       z.string().optional(),
  cor:                z.string().optional(),
  sexo:               z.string().optional(),
  nascimento_filhote: z.string().optional(),
  ip_timestamp:       z.string().optional(),
});

async function uploadFile(sb: ReturnType<typeof supabaseAdmin>, code: string, field: string, file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES) throw new Error(`Arquivo ${field} excede 10 MB`);
  const ext    = file.name.split(".").pop() ?? "bin";
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
  const buffer = Buffer.from(base64, "base64");
  const path   = `${code}/assinatura.png`;
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, buffer, { contentType: "image/png", upsert: true });
  if (error) return null;
  return path;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`contract-submit:${ip}`, 10, 10 * 60_000);
  if (!rl.allowed) return NextResponse.json({ error: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 });

  try {
    const form       = await req.formData();
    const code       = String(form.get("code") ?? "").trim();
    const rawPayload = form.get("payload");
    const signatureDataUrl = String(form.get("signature") ?? "");

    if (!code) return NextResponse.json({ error: "Código do contrato ausente" }, { status: 400 });

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
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[contract/POST]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
