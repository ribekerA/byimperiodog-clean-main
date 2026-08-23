import { FileText, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import ContractForm from "@/components/ContractForm";
import { rateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const metadata: Metadata = {
  title: "Dados para Contrato",
  robots: { index: false, follow: false },
};

type ContractRow = {
  id: string;
  code: string;
  status: string;
  puppy_id: string;
  signed_at: string | null;
  expires_at: string | null;
};

type PuppyRow = { id: string; name?: string | null };

async function fetchContract(code: string): Promise<{ contract: ContractRow; puppy: PuppyRow | null } | null> {
  try {
    const sb = supabaseAdmin();
    const { data: initialContract, error } = await sb
      .from("contracts")
      .select("id,code,status,puppy_id,signed_at,expires_at")
      .eq("code", code)
      .maybeSingle();
    let contract = initialContract;

    // Fallback enquanto a migração de expires_at (sql/migration_contracts_expires_at.sql) não roda em produção.
    if (error && String(error.message).includes("expires_at")) {
      ({ data: contract } = await sb
        .from("contracts")
        .select("id,code,status,puppy_id,signed_at")
        .eq("code", code)
        .maybeSingle());
    }

    if (!contract) return null;
    const row = contract as ContractRow;
    // Só o link de preenchimento expira — uma vez assinado, o contrato vira documento permanente (garantia de saúde etc.).
    if (row.status !== "assinado" && row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return null;

    const { data: puppy } = await sb
      .from("puppies")
      .select("id,name")
      .eq("id", row.puppy_id)
      .maybeSingle();

    return { contract: row, puppy: puppy as PuppyRow | null };
  } catch {
    return null;
  }
}

export default async function ContractPage(props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`contract-view:${ip}`, 30, 60_000);
  if (!rl.allowed) notFound();

  const result = await fetchContract(params.code);
  if (!result) notFound();

  const { contract, puppy } = result;
  const isCompleted = contract.status === "assinado";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-2 text-2xl font-bold text-zinc-900">
          <span>🐾</span> By Império Dog
        </div>
        <h1 className="text-xl font-semibold text-zinc-800">
          {isCompleted ? "Contrato preenchido" : "Dados para Contrato"}
        </h1>
        {puppy?.name && (
          <p className="mt-1 text-sm text-zinc-500">Filhote: <strong>{puppy.name}</strong></p>
        )}
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-500">
          <FileText className="h-3.5 w-3.5" />
          Código: <span className="font-mono font-semibold">{contract.code}</span>
        </div>
      </div>

      {isCompleted ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center space-y-4">
          <ShieldCheck className="mx-auto h-14 w-14 text-emerald-500" />
          <h2 className="text-xl font-bold text-emerald-900">Dados já enviados</h2>
          <p className="text-sm text-emerald-700">
            Os dados deste contrato foram preenchidos em{" "}
            {contract.signed_at
              ? new Date(contract.signed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
              : "data registrada"}.
          </p>
          <p className="text-xs text-emerald-600">
            Dúvidas? Entre em contato pelo WhatsApp com o código <span className="font-mono font-semibold">{contract.code}</span>.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Instruções importantes:</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5 text-xs">
              <li>Preencha todos os campos com seus dados reais (como no documento de identidade)</li>
              <li>Anexe os documentos recebidos no dia da entrega do filhote</li>
              <li>Guarde o código <span className="font-mono font-semibold">{contract.code}</span> para referência futura</li>
            </ul>
          </div>

          <ContractForm code={contract.code} puppyName={puppy?.name ?? undefined} />
        </>
      )}

      {/* Rodapé de confiança */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-zinc-400">
        <span>🔒 Dados protegidos (LGPD)</span>
        <span>📄 Contrato digital</span>
        <span>🩺 Garantia de saúde</span>
      </div>
    </div>
  );
}
