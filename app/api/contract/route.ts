export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendLeadAutoResponse } from "@/lib/email";

const STORAGE_BUCKET = "contracts";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const payloadSchema = z.object({
  nome:      z.string().min(3),
  cpf:       z.string().min(11),
  email:     z.string().email().optional().or(z.literal("")),
  telefone:  z.string().min(10),
  endereco:  z.string().min(5),
  nascimento: z.string().optional(),
});

async function uploadFile(
  sb: ReturnType<typeof supabaseAdmin>,
  code: string,
  field: string,
  file: File,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES) throw new Error(`Arquivo ${field} excede 10 MB`);

  const ext      = file.name.split(".").pop() ?? "bin";
  const path     = `${code}/${field}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  const { error } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) throw new Error(`Erro ao enviar ${field}: ${error.message}`);
  return path;
}

export async function POST(req: NextRequest) {
  try {
    const form    = await req.formData();
    const code    = String(form.get("code") ?? "").trim();
    const rawPayload = form.get("payload");

    if (!code) return NextResponse.json({ error: "Código do contrato ausente" }, { status: 400 });

    let buyerData: z.infer<typeof payloadSchema>;
    try {
      const parsed = JSON.parse(String(rawPayload ?? "{}"));
      const result = payloadSchema.safeParse(parsed);
      if (!result.success) {
        return NextResponse.json({ error: "Dados inválidos", details: result.error.errors }, { status: 400 });
      }
      buyerData = result.data;
    } catch {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const sb = supabaseAdmin();

    // Verifica se o contrato existe e está pendente
    const { data: contract, error: findErr } = await sb
      .from("contracts")
      .select("id, code, status, puppy_id")
      .eq("code", code)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!contract) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    if (contract.status === "assinado") {
      return NextResponse.json({ error: "Este contrato já foi preenchido" }, { status: 409 });
    }

    // Upload de arquivos
    const hemogramaFile = form.get("hemograma") as File | null;
    const laudoFile     = form.get("laudo")     as File | null;

    const [hemogramaPath, laudoPath] = await Promise.all([
      hemogramaFile instanceof File ? uploadFile(sb, code, "hemograma", hemogramaFile) : Promise.resolve(null),
      laudoFile instanceof File     ? uploadFile(sb, code, "laudo",     laudoFile)     : Promise.resolve(null),
    ]);

    // Atualiza contrato com dados do comprador
    const { error: updateErr } = await sb
      .from("contracts")
      .update({
        payload:        buyerData,
        hemograma_path: hemogramaPath ?? undefined,
        laudo_path:     laudoPath     ?? undefined,
        status:         "assinado",
        signed_at:      new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      })
      .eq("id", contract.id);

    if (updateErr) throw updateErr;

    // Notifica criadora por e-mail (opcional — requer RESEND_API_KEY)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendLeadAutoResponse({
        name:  `[Contrato ${code}] ${buyerData.nome}`,
        email: adminEmail,
        phone: buyerData.telefone,
        city:  buyerData.endereco,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[contract/POST]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
