"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

import PuppyForm from "../_components/PuppyForm";

export default function NewPuppyPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 px-6 py-8">
      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
        <Link
          href="/admin/puppies"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 transition hover:bg-[var(--surface-2)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar para listagem
        </Link>
      </div>

      <header className="space-y-2">
        <h1 className="flex items-center gap-2 text-3xl font-semibold text-[var(--text)]">
          <Sparkles className="h-6 w-6 text-[var(--accent)]" aria-hidden />
          Cadastrar novo filhote
        </h1>
        <p className="max-w-3xl text-sm text-[var(--text-muted)]">
          Preencha as informacoes abaixo para colocar o filhote na vitrine. Campos com * sao obrigatorios e a midia pode ser organizada por arrastar e soltar.
        </p>
      </header>

      <PuppyForm
        mode="create"
        onCompleted={() => {
          router.push("/admin/puppies");
          router.refresh();
        }}
      />
    </div>
  );
}

