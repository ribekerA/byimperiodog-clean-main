export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { BRAND } from "@/domain/config";
import {
  contractCanBeFilled, validContractCode, contractUploadPath, validateContractFile,
  InvalidContractFile, CONTRACT_MAX_FILE_BYTES, CONTRACT_MAX_SIGNATURE_BYTES, readContractForm,
} from "@/lib/contract-security";
import { rateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const STORAGE_BUCKET = "contracts";
const payloadSchema = z.object({
  nome: z.string().min(3).max(160),
  cpf: z.string().min(11).max(20),
  rg: z.string().max(30).optional(),
  email: z.string().email().max(254).optional().or(z.literal("")),
  telefone: z.string().min(10).max(30),
  endereco: z.string().min(5).max(500),
  nascimento: z.string().max(30).optional(),
  nome_filhote: z.string().max(160).optional(),
  cor: z.string().max(50).optional(),
  sexo: z.string().max(20).optional(),
  nascimento_filhote: z.string().max(30).optional(),
});

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (req.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(req.url).origin)) {
    return NextResponse.json({ error: "Solicitação não permitida" }, { status: 403 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`contract-submit:${ip}`, 10, 10 * 60_000).allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente mais tarde." }, { status: 429 });
  }

  try {
    const form = await readContractForm(req);
    const code = String(form.get("code") ?? "").trim();
    if (!validContractCode(code)) return NextResponse.json({ error: "Link inválido" }, { status: 400 });
    const rawPayload = String(form.get("payload") ?? "{}");
    if (rawPayload.length > 8000) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    let buyerData: z.infer<typeof payloadSchema>;
    try {
      const result = payloadSchema.safeParse(JSON.parse(rawPayload));
      if (!result.success) return NextResponse.json({ error: "Confira os dados preenchidos" }, { status: 400 });
      buyerData = result.data;
    } catch { return NextResponse.json({ error: "Dados inválidos" }, { status: 400 }); }

    const signature = String(form.get("signature") ?? "");
    if (!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(signature) ||
      signature.length > Math.ceil(CONTRACT_MAX_SIGNATURE_BYTES * 4 / 3) + 30) {
      return NextResponse.json({ error: "Assinatura válida obrigatória" }, { status: 422 });
    }

    const sb = supabaseAdmin();
    const { data: contract, error } = await sb.from("contracts")
      .select("id,status,expires_at").eq("code", code).maybeSingle();
    if (error) throw new Error("contract-read");
    if (!contract || !contractCanBeFilled(contract)) {
      return NextResponse.json({ error: "Link indisponível, expirado ou já utilizado" }, { status: 410 });
    }

    // Fail closed: nenhum documento novo é enviado para bucket público ou não verificado.
    const { data: bucket, error: bucketError } = await sb.storage.getBucket(STORAGE_BUCKET);
    if (bucketError || !bucket || bucket.public !== false) {
      return NextResponse.json({ error: "Envio temporariamente indisponível. Contate a equipe." }, { status: 503 });
    }

    const validated: { field: string; media: Awaited<ReturnType<typeof validateContractFile>> }[] = [
      { field: "assinatura", media: await validateContractFile(Buffer.from(signature.split(",")[1], "base64"), "image/png", true) },
    ];
    for (const field of ["hemograma", "laudo"]) {
      const file = form.get(field);
      if (file instanceof File && file.size > 0) {
        if (file.size > CONTRACT_MAX_FILE_BYTES) throw new InvalidContractFile("Arquivo acima de 10 MB");
        validated.push({ field, media: await validateContractFile(Buffer.from(await file.arrayBuffer()), file.type) });
      }
    }
    const paths: Record<string, string> = {};
    for (const { field, media } of validated) {
      const path = contractUploadPath(code, field, media.extension);
      const { error: uploadError } = await sb.storage.from(STORAGE_BUCKET)
        .upload(path, media.buffer, { contentType: media.contentType, upsert: false });
      if (uploadError) throw new Error("contract-upload");
      paths[field] = path;
    }

    const { data: updated, error: updateError } = await sb.from("contracts").update({
      payload: buyerData,
      hemograma_path: paths.hemograma ?? undefined,
      laudo_path: paths.laudo ?? undefined,
      signature_path: paths.assinatura,
      status: "assinado",
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", contract.id).eq("status", "pendente")
      .gt("expires_at", new Date().toISOString()).select("id").maybeSingle();
    if (updateError) throw new Error("contract-update");
    if (!updated) return NextResponse.json({ error: "Link já utilizado ou expirado" }, { status: 409 });

    // Notificação sem interpolar dados do comprador em HTML.
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: "By Império Dog <noreply@byimperiodog.com.br>",
          to: [process.env.ADMIN_EMAIL || BRAND.contact.email],
          subject: "Contrato preenchido — By Império Dog",
          text: "Um contrato foi preenchido. Consulte o documento no painel administrativo autenticado.",
        }),
      }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InvalidContractFile) return NextResponse.json({ error: error.message }, { status: 422 });
    console.error("[contract/POST] Não foi possível concluir o envio");
    return NextResponse.json({ error: "Não foi possível concluir. Tente novamente ou contate a equipe." }, { status: 500 });
  }
}
