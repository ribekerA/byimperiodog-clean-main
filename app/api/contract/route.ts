export const dynamic = "force-dynamic";

import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { BRAND } from "@/domain/config";
import { verifyContractAccessToken } from "@/lib/contractAccess";
import { limiteDeTaxa } from "@/lib/limitePublico";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { detectMediaMime } from "@/lib/uploadValidation";

const STORAGE_BUCKET = "contracts";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_SIGNATURE_BYTES = 1024 * 1024;
const MAX_REQUEST_BYTES = 24 * 1024 * 1024;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || BRAND.contact.email;

function validCpf(value: string): boolean {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

const payloadSchema = z.object({
  nome: z.string().trim().min(3).max(160),
  cpf: z.string().transform((value) => value.replace(/\D/g, "")).refine(validCpf, "CPF inválido"),
  rg: z.string().trim().max(30).optional(),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  telefone: z.string().transform((value) => value.replace(/\D/g, "")).refine((value) => value.length >= 10 && value.length <= 13),
  endereco: z.string().trim().min(5).max(300),
  nascimento: z.string().trim().max(20).optional(),
  nome_filhote: z.string().trim().max(120).optional(),
  cor: z.string().trim().max(60).optional(),
  sexo: z.string().trim().max(30).optional(),
  nascimento_filhote: z.string().trim().max(20).optional(),
}).strict();

type ContractFile = { bytes: Buffer; mime: string; ext: string };

async function validateContractFile(file: File, field: string): Promise<ContractFile> {
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error(`${field}_invalid_size`);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-") return { bytes, mime: "application/pdf", ext: "pdf" };
  const detected = detectMediaMime(bytes);
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
  };
  const ext = detected ? extensions[detected] : undefined;
  if (!detected || !ext) throw new Error(`${field}_invalid_type`);
  return { bytes, mime: detected, ext };
}

function validateSignature(dataUrl: string): Buffer {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) throw new Error("signature_invalid");
  const bytes = Buffer.from(match[1], "base64");
  if (bytes.byteLength <= 0 || bytes.byteLength > MAX_SIGNATURE_BYTES || detectMediaMime(bytes) !== "image/png") {
    throw new Error("signature_invalid");
  }
  return bytes;
}

function tamanhoRealDoFormulario(form: FormData): number {
  let total = 0;
  form.forEach((value) => {
    total += value instanceof File ? value.size : Buffer.byteLength(value, "utf8");
  });
  return total;
}

async function uploadValidatedFile(
  sb: ReturnType<typeof supabaseAdmin>,
  storagePrefix: string,
  field: string,
  file: ContractFile,
): Promise<string> {
  const path = `${storagePrefix}/${field}.${file.ext}`;
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, file.bytes, {
    contentType: file.mime,
    upsert: false,
  });
  if (error) throw new Error(`${field}_upload_failed`);
  return path;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export async function POST(req: NextRequest) {
  const bloqueio = await limiteDeTaxa(req, "contract-submit", 6, 10 * 60_000);
  if (bloqueio) return bloqueio;

  const declaredLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Envio grande demais" }, { status: 413 });
  }

  try {
    const form = await req.formData();
    if (tamanhoRealDoFormulario(form) > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Envio grande demais" }, { status: 413 });
    }
    const code = String(form.get("code") ?? "").trim().toUpperCase();
    const accessToken = String(form.get("access_token") ?? "");
    if (!/^(?:[A-F0-9]{12}|[A-F0-9]{32})$/.test(code) || !verifyContractAccessToken(code, accessToken)) {
      return NextResponse.json({ error: "Link de contrato inválido" }, { status: 404 });
    }

    const rawPayload = String(form.get("payload") ?? "{}");
    if (rawPayload.length > 16_384) return NextResponse.json({ error: "Dados grandes demais" }, { status: 413 });
    const payloadJson = (() => { try { return JSON.parse(rawPayload); } catch { return null; } })();
    const payloadResult = payloadSchema.safeParse(payloadJson);
    if (!payloadResult.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    const signatureBytes = validateSignature(String(form.get("signature") ?? ""));
    const hemogramaInput = form.get("hemograma");
    const laudoInput = form.get("laudo");
    const [hemograma, laudo] = await Promise.all([
      hemogramaInput instanceof File && hemogramaInput.size > 0 ? validateContractFile(hemogramaInput, "hemograma") : null,
      laudoInput instanceof File && laudoInput.size > 0 ? validateContractFile(laudoInput, "laudo") : null,
    ]);

    const sb = supabaseAdmin();
    const { data: contract, error: findError } = await sb
      .from("contracts")
      .select("id,code,status,expires_at")
      .eq("code", code)
      .maybeSingle();
    if (findError) throw findError;
    if (!contract) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    if (contract.status === "assinado") return NextResponse.json({ error: "Este contrato já foi assinado" }, { status: 409 });
    if (contract.expires_at && new Date(contract.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Este link de contrato expirou" }, { status: 410 });
    }

    const signature: ContractFile = { bytes: signatureBytes, mime: "image/png", ext: "png" };
    const storagePrefix = `${code}/${randomUUID()}`;
    const [hemogramaPath, laudoPath, signaturePath] = await Promise.all([
      hemograma ? uploadValidatedFile(sb, storagePrefix, "hemograma", hemograma) : null,
      laudo ? uploadValidatedFile(sb, storagePrefix, "laudo", laudo) : null,
      uploadValidatedFile(sb, storagePrefix, "assinatura", signature),
    ]);

    const signedAt = new Date().toISOString();
    const buyerData = { ...payloadResult.data, ip_timestamp: signedAt };
    const { data: updated, error: updateError } = await sb
      .from("contracts")
      .update({
        payload: buyerData,
        hemograma_path: hemogramaPath ?? undefined,
        laudo_path: laudoPath ?? undefined,
        signature_path: signaturePath,
        status: "assinado",
        signed_at: signedAt,
        updated_at: signedAt,
      } as Parameters<ReturnType<typeof sb.from>["update"]>[0])
      .eq("id", contract.id)
      .neq("status", "assinado")
      .select("id")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!updated) return NextResponse.json({ error: "Este contrato já foi assinado" }, { status: 409 });

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const name = escapeHtml(buyerData.nome);
      const puppy = escapeHtml(buyerData.nome_filhote || "—");
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: "By Império Dog <noreply@byimperiodog.com.br>",
          to: [ADMIN_EMAIL],
          subject: `Contrato ${code} assinado`,
          html: `<p>O comprador <strong>${name}</strong> assinou o contrato <code>${code}</code>.</p><p>Filhote: ${puppy}</p>`,
        }),
        signal: AbortSignal.timeout(5000),
      }).catch(() => undefined);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contract/POST] falha controlada", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Não foi possível concluir o contrato" }, { status: 500 });
  }
}
