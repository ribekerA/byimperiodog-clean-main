"use client";

import React from "react";

import ColorChips from "@/components/puppies/ColorChips";
import CoverPreview from "@/components/puppies/CoverPreview";
import MediaGallery from "@/components/puppies/MediaGallery";
import PriceInput from "@/components/puppies/PriceInput";
import StatusToggle from "@/components/puppies/StatusToggle";
import { usePuppyForm } from "@/components/puppies/usePuppyForm";
import FormCard from "@/components/ui/FormCard";
import type { RawPuppy } from "@/types/puppy";

interface PuppyFormProps {
  mode?: "create" | "edit";
  record?: RawPuppy | null;
  colorPresets?: string[];
  onCompleted?: (payload?: any) => void;
}

const DEFAULT_COLORS = [
  "Branco",
  "Preto",
  "Laranja",
  "Creme",
  "Chocolate",
  "Parti",
  "Merle",
  "Fogo",
  "Bege",
];

export default function PuppyForm({
  mode = "create",
  record = null,
  colorPresets = DEFAULT_COLORS,
  onCompleted,
}: PuppyFormProps) {
  const {
    isEdit,
    values,
    set,
    setMedia,
    setCover,
    errors,
    submitting,
    submit,
    showSummary,
    setShowSummary,
    firstErrorRef,
    summaryRef,
  } = usePuppyForm({ mode, record: record ?? undefined, onSuccess: onCompleted });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="mt-6 grid gap-4 text-sm md:grid-cols-12"
    >
      <div className="grid gap-4 md:col-span-7">
        <FormCard title="Informacoes basicas" subtitle="Identificacao, status e preco" asFieldset>
          {showSummary && Object.keys(errors).length > 0 && (
            <div
              ref={summaryRef}
              role="alert"
              aria-live="assertive"
              className="mb-3 rounded-lg border border-[var(--error)] bg-[var(--error)]/10 p-3 text-[12px] text-[var(--error)]"
            >
              <p className="mb-1 font-semibold">
                Existem {Object.keys(errors).length} campos com pendencias:
              </p>
              <ul className="list-disc space-y-0.5 pl-4">
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>
                    <span className="font-medium">{key}</span>: {message}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setShowSummary(false)}
                className="mt-2 inline-flex text-[11px] underline"
              >
                Ocultar lista
              </button>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3 md:gap-3">
            <div className="grid gap-1">
              <label htmlFor="codigo" className="font-medium">
                Codigo
              </label>
              <input
                id="codigo"
                value={values.codigo}
                onChange={(event) => set("codigo", event.target.value.toUpperCase())}
                placeholder="Opcional"
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              />
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label htmlFor="nome" className="font-medium">
                Nome <span className="text-[var(--error)]">*</span>
              </label>
              <input
                ref={firstErrorRef}
                id="nome"
                value={values.nome}
                onChange={(event) => set("nome", event.target.value)}
                aria-invalid={Boolean(errors.nome)}
                aria-describedby={errors.nome ? "nome-error" : undefined}
                placeholder="Ex: Spitz Alemao"
                className={`rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 focus:ring-2 focus:ring-[var(--accent)] ${
                  errors.nome ? "border-[var(--error)]" : ""
                }`}
              />
              {errors.nome ? (
                <p id="nome-error" className="text-[11px] text-[var(--error)]">
                  {errors.nome}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5 md:gap-3">
            <div className="grid gap-1 md:col-span-1">
              <label htmlFor="gender" className="font-medium">
                Sexo
              </label>
              <select
                id="gender"
                value={values.gender}
                onChange={(event) => set("gender", event.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              >
                <option value="female">Fêmea</option>
                <option value="male">Macho</option>
              </select>
            </div>
            <div className="grid gap-1 md:col-span-2">
              <label className="font-medium" id="status-label">
                Status
              </label>
              <StatusToggle value={values.status} onChange={(next) => set("status", next)} />
            </div>
            <div className="md:col-span-2">
              <ColorChips value={values.color} options={colorPresets} onChange={(next) => set("color", next)} />
              {errors.color ? (
                <p className="pt-1 text-[11px] text-[var(--error)]">{errors.color}</p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <PriceInput value={values.price_display} onChange={(val) => set("price_display", val)} error={errors.price_display} />
            </div>
            <div className="grid gap-1 md:col-span-1">
              <label htmlFor="nascimento" className="font-medium">
                Nascimento
              </label>
              <input
                id="nascimento"
                type="date"
                value={values.nascimento}
                onChange={(event) => set("nascimento", event.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
              />
              {errors.nascimento ? (
                <p className="text-[11px] text-[var(--error)]">{errors.nascimento}</p>
              ) : null}
            </div>
          </div>
        </FormCard>

        <FormCard title="Descricao" asFieldset>
          <div className="grid gap-1">
            <label htmlFor="descricao" className="font-medium">
              Descricao publica
            </label>
            <textarea
              id="descricao"
              value={values.descricao}
              onChange={(event) => set("descricao", event.target.value)}
              rows={3}
              placeholder="Resumo para a vitrine"
              className="resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
            />
            <p className="text-[11px] text-[var(--text-muted)]">Opcional, exibido no site.</p>
          </div>
          <div className="grid gap-1">
            <label htmlFor="notes" className="font-medium">
              Notas internas
            </label>
            <textarea
              id="notes"
              value={values.notes}
              onChange={(event) => set("notes", event.target.value)}
              rows={2}
              placeholder="Informacoes apenas para o time"
              className="resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="video_url" className="font-medium">
              Video (URL)
            </label>
            <input
              id="video_url"
              value={values.video_url}
              onChange={(event) => set("video_url", event.target.value)}
              placeholder="https://..."
              className={`rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 ${
                errors.video_url ? 'border-[var(--error)]' : ''
              }`}
            />
            {errors.video_url ? (
              <p className="text-[11px] text-[var(--error)]">{errors.video_url}</p>
            ) : null}
          </div>
        </FormCard>

        <FormCard title="Salvar" asFieldset>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-contrast)] shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
              disabled={submitting}
            >
              {submitting ? (isEdit ? "Salvando..." : "Cadastrando...") : isEdit ? "Salvar alteracoes" : "Salvar cadastro"}
            </button>
          </div>
        </FormCard>
      </div>

      <div className="grid gap-4 md:col-span-5">
        <FormCard title="Midia" asFieldset>
          <CoverPreview url={values.image_url} onChange={(url) => setCover(url)} />
          <MediaGallery media={values.midia} cover={values.image_url} onSelectCover={(url) => setCover(url)} onChange={(list) => setMedia(list)} />
          <p className="text-[11px] text-[var(--text-muted)]">
            Arraste e solte imagens, defina a capa e organize a ordem de exibicao.
          </p>
        </FormCard>
      </div>
    </form>
  );
}
