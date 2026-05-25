"use client";

import { useMemo, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import StaticPuppyCard from "./StaticPuppyCard";

type AnyPuppy = {
  id: string;
  slug: string;
  name: string;
  color?: string;
  cor?: string;
  sex?: string;
  gender?: string;
  status?: string;
  priceCents?: number;
  price_cents?: number;
  images: string[];
  description?: string;
  [key: string]: unknown;
};

type Props = {
  puppies: AnyPuppy[];
};

const SEX_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "female", label: "Fêmea" },
  { value: "male", label: "Macho" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "available", label: "Disponíveis" },
  { value: "reserved", label: "Reservados" },
];

export default function StaticCatalog({ puppies }: Props) {
  const [filterColor, setFilterColor] = useState("");
  const [filterSex, setFilterSex] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const colors = useMemo(() => {
    const set = new Set<string>();
    for (const p of puppies) {
      const c = p.color ?? (p.cor as string | undefined)?.toLowerCase();
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [puppies]);

  const filtered = useMemo(() => {
    return puppies.filter((p) => {
      const pColor = p.color ?? (p.cor as string | undefined)?.toLowerCase() ?? "";
      const pSex = p.sex ?? p.gender ?? "";
      const pStatus = (p.status ?? "available").toLowerCase();
      const statusNorm =
        pStatus === "disponivel" ? "available" :
        pStatus === "reservado" ? "reserved" :
        pStatus === "vendido" ? "sold" :
        pStatus;

      if (filterColor && pColor !== filterColor) return false;
      if (filterSex && pSex !== filterSex) return false;
      if (filterStatus && statusNorm !== filterStatus) return false;
      return true;
    });
  }, [puppies, filterColor, filterSex, filterStatus]);

  const hasFilters = filterColor || filterSex || filterStatus;

  const waEmpty = buildWhatsAppLink({
    message: "Olá! Não encontrei o filhote que procuro no catálogo. Pode me ajudar a encontrar o Spitz ideal?",
    utmSource: "site",
    utmMedium: "catalog_empty",
    utmCampaign: "filhotes",
  });

  return (
    <>
      {/* Page hero */}
      <div className="bg-[var(--brand)] px-5 py-10 text-center sm:px-8 sm:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Criação responsável · Bragança Paulista, SP</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">
          Filhotes disponíveis
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/70">
          Cada filhote sai com pedigree CBKC, laudos veterinários e mentoria vitalícia. Saúde documentada, sem surpresas.
        </p>
      </div>

    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="mb-6 space-y-3 sm:mb-8">
        {/* Contagem */}
        <p className="text-sm text-zinc-500">
          <span className="font-semibold text-zinc-900">{filtered.length}</span> de {puppies.length} filhotes
        </p>

        {/* Pills de cor — scroll horizontal no mobile */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filtrar por cor"
        >
          <button
            type="button"
            onClick={() => setFilterColor("")}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              !filterColor ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Todas
          </button>
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilterColor(c === filterColor ? "" : c)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold capitalize transition ${
                filterColor === c ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {c}
            </button>
          ))}
          {/* Separador visual */}
          <span className="mx-1 shrink-0 self-center h-4 w-px bg-zinc-200" aria-hidden="true" />
          {/* Sexo como pills */}
          {SEX_OPTIONS.filter((o) => o.value !== "").map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setFilterSex(filterSex === o.value ? "" : o.value)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                filterSex === o.value ? "bg-violet-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {o.label}
            </button>
          ))}
          {/* Separador */}
          <span className="mx-1 shrink-0 self-center h-4 w-px bg-zinc-200" aria-hidden="true" />
          {/* Status como pills */}
          {STATUS_OPTIONS.filter((o) => o.value !== "").map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setFilterStatus(filterStatus === o.value ? "" : o.value)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                filterStatus === o.value ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {o.label}
            </button>
          ))}
          {/* Limpar */}
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setFilterColor(""); setFilterSex(""); setFilterStatus(""); }}
              className="shrink-0 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100 active:scale-95"
            >
              ✕ Limpar
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((puppy, i) => (
            <li key={puppy.id}>
              <StaticPuppyCard
                id={puppy.id}
                slug={puppy.slug}
                name={puppy.name}
                color={puppy.color}
                cor={puppy.cor as string | undefined}
                sex={puppy.sex}
                gender={puppy.gender}
                status={puppy.status}
                priceCents={puppy.priceCents}
                price_cents={puppy.price_cents}
                images={puppy.images}
                description={puppy.description}
                priority={i < 4}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-zinc-200 py-16 text-center">
          <p className="text-zinc-500">
            {hasFilters
              ? "Nenhum filhote encontrado com esses filtros."
              : "Nenhum filhote disponível no momento."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {hasFilters && (
              <button
                type="button"
                onClick={() => { setFilterColor(""); setFilterSex(""); setFilterStatus(""); }}
                className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                Limpar filtros
              </button>
            )}
            <a
              href={waEmpty}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
              Falar com a criadora
            </a>
          </div>
        </div>
      )}
    </section>
    </>
  );
}
