export const dynamic = "force-dynamic";

import { randomUUID } from "crypto";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { listContracts, type ContractsClient } from "@/lib/admin/contractsAdmin";
import { requireAdminApi } from "@/lib/adminAuth";
import { createContractAccessToken } from "@/lib/contractAccess";
import { corpoJson } from "@/lib/limitePublico";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const contractInput = z.object({
  lead_id: z.string().uuid().nullish(),
  total_price_cents: z.number().int().min(0).max(100_000_000).nullish(),
  nome_filhote: z.string().trim().max(160).optional(),
  cor: z.string().trim().max(50).optional(),
  sexo: z.string().trim().max(20).optional(),
  nascimento_filhote: z.string().max(30).optional(),
});

export async function GET(req: NextRequest) {
  const guard = requireAdminApi(req);
  if (guard) return guard;

  try {
    const { items: rows, features } = await listContracts(supabaseAdmin() as unknown as ContractsClient);
    const items = rows.map((contract) => ({
      ...contract,
      access_token: createContractAccessToken(contract.code),
    }));
    return NextResponse.json({ ok: true, items, features }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // So o codigo do banco vai para o log: nenhum dado de contrato, nenhum erro bruto ao cliente.
    console.error("[admin/contracts] falha ao listar", { code: (error as { code?: string } | null)?.code ?? "erro" });
    return NextResponse.json({ ok: false, error: "Não foi possível carregar os contratos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = requireAdminApi(req);
  if (guard) return guard;

  const body = await corpoJson<unknown>(req);
  if (body.resposta) return body.resposta;
  const parsed = contractInput.safeParse(body.dados);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Dados do contrato inválidos" }, { status: 400 });
  const {
    lead_id, total_price_cents,
    nome_filhote, cor, sexo, nascimento_filhote,
  } = parsed.data;

  try {
    const sb   = supabaseAdmin();
    const code = randomUUID().replace(/-/g, "").toUpperCase();

    // Payload inicial com dados do filhote preenchidos pelo admin
    const payload = {
      nome_filhote:       nome_filhote       ?? "",
      cor:                cor                ?? "",
      sexo:               sexo               ?? "",
      nascimento_filhote: nascimento_filhote ?? "",
    };

    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await sb
      .from("contracts")
      .insert({
        code,
        lead_id:           lead_id           ?? null,
        status:            "pendente",
        total_price_cents: total_price_cents ?? null,
        payload,
        expires_at:        expiresAt,
      } as Parameters<ReturnType<typeof sb.from>["insert"]>[0])
      .select("id,code")
      .single();

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://byimperiodog.com.br";
    const accessToken = createContractAccessToken(data.code);
    const link = `${baseUrl}/contract/${data.code}?token=${encodeURIComponent(accessToken)}`;

    return NextResponse.json({ ok: true, code: data.code, link });
  } catch (e: unknown) {
    // O erro do banco nao e um Error: a mensagem vem no campo message do objeto.
    const msg = e instanceof Error ? e.message : String((e as { message?: unknown } | null)?.message ?? e);

    // Instrução de migration caso puppy_id ainda seja NOT NULL no DB
    if (msg.includes("puppy_id") || msg.includes("violates not-null")) {
      return NextResponse.json({
        ok: false,
        error: "puppy_id_not_null",
        message: "Peça ao time técnico para aplicar a migração pendente que permite contratos sem filhote vinculado.",
      }, { status: 422 });
    }

    // Instrução de migration caso expires_at ainda não exista no DB
    if (msg.includes("expires_at")) {
      return NextResponse.json({
        ok: false,
        error: "expires_at_missing",
        message: "O banco ainda não tem a coluna de validade do link (expires_at). Sem ela o comprador não consegue abrir o contrato, então ele não foi criado. Falta aplicar a migração supabase/migrations/20260828140000_security_and_lgpd_hardening.sql.",
      }, { status: 422 });
    }

    return NextResponse.json({ ok: false, error: "Não foi possível criar o contrato" }, { status: 500 });
  }
}
