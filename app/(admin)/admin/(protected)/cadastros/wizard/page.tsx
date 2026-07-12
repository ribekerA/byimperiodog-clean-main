"use client";

import AdminWizard from "@/components/admin/wizard/AdminWizard";

export default function CadastroWizardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Wizard de Cadastro</h1>
        <p className="text-sm text-zinc-600">Fluxo guiado com validação, autosave e pequenos reforços positivos.</p>
      </header>
      <AdminWizard />
    </div>
  );
}
