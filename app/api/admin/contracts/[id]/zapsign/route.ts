export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateContractPdf } from "@/lib/contractPdf";
import { createZapSignDocument, isConfigured } from "@/lib/zapsign";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.byimperiodog.com.br").replace(/\/$/, "");

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = requireAdminApi(req);
  if (guard) return guard;

  if (!isConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "ZAPSIGN_API_TOKEN não configurado",
      help: "Adicione ZAPSIGN_API_TOKEN nas variáveis de ambiente do projeto.",
    }, { status: 422 });
  }

  const sb = supabaseAdmin();

  // Busca o contrato
  const { data: contract, error: findErr } = await sb
    .from("contracts")
    .select("id,code,status,payload,total_price_cents,zapsign_doc_token")
    .eq("id", params.id)
    .maybeSingle();

  if (findErr) return NextResponse.json({ ok: false, error: findErr.message }, { status: 500 });
  if (!contract) return NextResponse.json({ ok: false, error: "Contrato não encontrado" }, { status: 404 });

  const zapToken = (contract as Record<string, unknown>).zapsign_doc_token as string | null;
  if (zapToken) {
    return NextResponse.json({ ok: false, error: "Contrato já enviado ao ZapSign", zapsign_doc_token: zapToken }, { status: 409 });
  }

  const payload = (contract.payload ?? {}) as Record<string, string | undefined>;

  // Verifica dados mínimos para enviar
  if (!payload.nome) {
    return NextResponse.json({ ok: false, error: "Aguardando dados do comprador (nome obrigatório)" }, { status: 422 });
  }

  // Gera o PDF
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateContractPdf({
      code:               contract.code,
      nome:               payload.nome              ?? "",
      cpf:                payload.cpf               ?? "",
      rg:                 payload.rg                ?? "",
      email:              payload.email             ?? "",
      telefone:           payload.telefone          ?? "",
      endereco:           payload.endereco          ?? "",
      nascimento:         payload.nascimento        ?? "",
      nome_filhote:       payload.nome_filhote      ?? "",
      cor:                payload.cor               ?? "",
      sexo:               payload.sexo              ?? "",
      nascimento_filhote: payload.nascimento_filhote ?? "",
      total_price_cents:  contract.total_price_cents,
      signed_at:          contract.status === "assinado" ? null : new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: `Erro ao gerar PDF: ${String(e)}` }, { status: 500 });
  }

  const base64Pdf = Buffer.from(pdfBytes).toString("base64");

  // Configura o signatário
  const phone = (payload.telefone ?? "").replace(/\D/g, "");
  const signer = {
    name:                    payload.nome,
    email:                   payload.email             || undefined,
    phone_country:           "55",
    phone_number:            phone                      || undefined,
    send_automatic_email:    Boolean(payload.email),
    send_automatic_whatsapp: Boolean(phone),
    auth_mode:               "assinaturaTela" as const,
    redirect_link:           `${BASE_URL}/contract/${contract.code}`,
  };

  // Cria o documento no ZapSign
  let zapDoc;
  try {
    zapDoc = await createZapSignDocument({
      name:        `Contrato ${contract.code} — By Império Dog`,
      base64_pdf:  base64Pdf,
      external_id: contract.code,
      webhook_url: `${BASE_URL}/api/webhooks/zapsign`,
      signers:     [signer],
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: `Erro ZapSign: ${String(e)}` }, { status: 500 });
  }

  // Salva o token do ZapSign no contrato
  const signLink = zapDoc.signers[0]?.sign_url ?? null;
  await sb
    .from("contracts")
    .update({
      zapsign_doc_token:    zapDoc.token,
      zapsign_sign_link:    signLink,
      zapsign_status:       "pending",
      updated_at:           new Date().toISOString(),
    } as Parameters<ReturnType<typeof sb.from>["update"]>[0])
    .eq("id", contract.id);

  return NextResponse.json({
    ok:                true,
    zapsign_doc_token: zapDoc.token,
    sign_link:         signLink,
    message:           `Documento enviado. ${signer.send_automatic_whatsapp ? "WhatsApp" : ""}${signer.send_automatic_email && signer.send_automatic_whatsapp ? " e " : ""}${signer.send_automatic_email ? "e-mail" : ""} de assinatura enviado ao comprador.`,
  });
}
