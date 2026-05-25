"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import confetti from "canvas-confetti";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { AdminButton } from "@/components/admin/ui/button";
import Stepper from "@/components/admin/ui/stepper";
import { showAdminToast } from "@/components/admin/ui/toast";
import useAutosave from "@/hooks/useAutosave";
import { adminCadastroSchema, type AdminCadastroInput } from "@/lib/schemas/adminCadastros";

type WizardValues = AdminCadastroInput;

const steps = [
  { id: "perfil", title: "Perfil" },
  { id: "preferencia", title: "Preferencia" },
  { id: "checklist", title: "Checklist" },
] as const;

export default function AdminWizard({ initialValues }: { initialValues?: Partial<WizardValues> }) {
  const methods = useForm<WizardValues>({
    resolver: zodResolver(adminCadastroSchema),
    mode: "onChange",
    defaultValues: initialValues ?? {
      perfil: { nome: "", email: "", telefone: "" },
      preferencia: { genero: "indiferente", cor: "", entrega: "presencial" },
      checklist: { casaPreparada: false, veterinarioReferencia: "", observacoes: "" },
    },
  });

  const { isDirty, isValid } = methods.formState;
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepId = steps[currentStep].id;

  useAutosave({
    enabled: isDirty,
    interval: 1200,
    values: methods.watch(),
    onSave: async (values) => {
      try {
        const response = await fetch("/admin/api/cadastros/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!response.ok) throw new Error("autosave_failed");
        showAdminToast({ title: "Progresso salvo automaticamente", variant: "info" });
      } catch (error) {
        showAdminToast({
          title: "Nao foi possivel salvar o rascunho",
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
      }
    },
  });

  function next() {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }

  function previous() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function onSubmit(values: WizardValues) {
    try {
      const response = await fetch("/admin/api/cadastros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("cadastro_failed");

      showAdminToast({ title: "Cadastro concluido!", variant: "success" });

      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 } });
      }
    } catch (error) {
      showAdminToast({
        title: "Erro ao concluir cadastro",
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="admin-card space-y-6">
        <Stepper steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />

        <section className="space-y-4">
          {currentStepId === "perfil" && (
            <>
              <fieldset>
                <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Nome
                </label>
                <input {...methods.register("perfil.nome")} className="admin-input" autoFocus />
                <FormError message={methods.formState.errors.perfil?.nome?.message} />
              </fieldset>
              <fieldset>
                <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  E-mail
                </label>
                <input {...methods.register("perfil.email")} className="admin-input" />
                <FormError message={methods.formState.errors.perfil?.email?.message} />
              </fieldset>
              <fieldset>
                <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Telefone
                </label>
                <input {...methods.register("perfil.telefone")} className="admin-input" />
                <FormError message={methods.formState.errors.perfil?.telefone?.message} />
              </fieldset>
            </>
          )}

          {currentStepId === "preferencia" && (
            <>
              <fieldset>
                <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Genero preferido
                </label>
                <select {...methods.register("preferencia.genero")} className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10">
                  <option value="">Selecione</option>
                  <option value="macho">Macho</option>
                  <option value="fêmea">Fêmea</option>
                </select>
              </fieldset>
              <fieldset>
                <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Cor desejada
                </label>
                <input {...methods.register("preferencia.cor")} className="admin-input" />
                <FormError message={methods.formState.errors.preferencia?.cor?.message} />
              </fieldset>
              <fieldset>
                <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Entrega
                </label>
                <select {...methods.register("preferencia.entrega")} className="admin-input">
                  <option value="presencial">Presencial</option>
                  <option value="concierge">Concierge</option>
                </select>
              </fieldset>
            </>
          )}

          {currentStepId === "checklist" && (
            <>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" {...methods.register("checklist.casaPreparada")} />
                Casa ja esta preparada para o filhote
              </label>
              <fieldset>
                <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Veterinario de referencia
                </label>
                <input {...methods.register("checklist.veterinarioReferencia")} className="admin-input" />
              </fieldset>
              <fieldset>
                <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Observacoes
                </label>
                <textarea {...methods.register("checklist.observacoes")} rows={4} className="admin-input" />
              </fieldset>
            </>
          )}
        </section>

        <div className="flex items-center justify-between">
          <AdminButton type="button" variant="outline" onClick={previous} disabled={currentStep === 0}>
            Voltar
          </AdminButton>
          {currentStep < steps.length - 1 ? (
            <AdminButton type="button" onClick={next}>
              Proximo
            </AdminButton>
          ) : (
            <AdminButton type="submit" disabled={!isValid}>
              Concluir cadastro
            </AdminButton>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-rose-600">{message}</p>;
}
