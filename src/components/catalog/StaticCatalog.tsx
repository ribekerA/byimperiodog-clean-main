"use client";

import { useMemo, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { matchesCatalogQuery, parseCatalogQuery } from "@/lib/catalog-query";
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
  priceCents?: number;
  price_cents?: number;
  images: string[];
  description?: string;
  [key: string]: unknown;
};

type Props = {
  puppies: AnyPuppy[];
  // Em /filhotes este bloco é o topo da página e o título dele é o H1. Nas
  // páginas regionais (SP, RJ, MG) a página já tem o próprio H1 com o estado
  // no texto, e o mesmo componente entrava com um segundo H1 — dois H1 na
  // mesma URL. Aqui o nível desce para 2 sem tocar em nenhuma classe, então
  // o visual é idêntico.
  headingLevel?: 1 | 2;
};

const SEX_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "female", label: "Fêmea" },
  { value: "male", label: "Macho" },
];

// Esta lista não é estoque, e por isso não tem filtro de estoque.
//
// Havia aqui um terceiro grupo de pills — "Disponíveis" e "Reservados" — e uma
// contagem "{n} de {total} filhotes" logo acima. Os dois liam um campo `status`
// do arquivo estático, que ninguém reescrevia a cada venda: a página anunciava
// como disponível o que já tinha saído e como reservado o que já tinha voltado.
// Cor e sexo continuam, porque descrevem a foto e não o estoque: são a mesma
// taxonomia das URLs editoriais /filhotes/cor/… e /filhotes/sexo/….

// Rótulo amigável para cores cujo slug não serve como texto. Está vazio porque
// toda cor divulgada tem slug de uma palavra só — o `capitalize` do fallback dá
// conta delas. Entradas retiradas da comunicação não entram nesta coleção.
const COLOR_LABELS: Record<string, string> = {};

export default function StaticCatalog({ puppies, headingLevel = 1 }: Props) {
  const HeroHeading = headingLevel === 2 ? "h2" : "h1";
  const [filterColor, setFilterColor] = useState("");
  const [filterSex, setFilterSex] = useState("");
  const [query, setQuery] = useState("");
  const parsedQuery = useMemo(() => parseCatalogQuery(query), [query]);
  const clearFilters = () => { setFilterColor(""); setFilterSex(""); setQuery(""); };

  const colors = useMemo(() => {
    const set = new Set<string>();
    for (const p of puppies) {
      const c = p.color ?? (p.cor as string | undefined)?.toLowerCase();
      if (c) set.add(c);
    }
    return Array.from(set).sort();
  }, [puppies]);

  const filtered = useMemo(() => {
    return puppies
      .filter((p) => {
        const pColor = p.color ?? (p.cor as string | undefined)?.toLowerCase() ?? "";
        const pSex = p.sex ?? p.gender ?? "";

        if (filterColor && pColor !== filterColor) return false;
        if (filterSex && pSex !== filterSex) return false;
        return matchesCatalogQuery(p, parsedQuery);
      });
    // Sem reordenar aqui de proposito. `puppiesPublicados` ja chega na ordem
    // comercial: `catalogPriority` decrescente primeiro, preco crescente
    // depois. Uma ordenacao por preco dentro deste componente descartava a
    // prioridade e punha o filhote mais barato no topo da vitrine -- a escolha
    // de destaque da responsavel virava ordem de liquidacao. Filtrar preserva
    // a ordem de entrada, entao nao ha o que refazer.
  }, [puppies, filterColor, filterSex, parsedQuery]);

  const hasFilters = Boolean(filterColor || filterSex || query);

  const baseWaEmpty = buildWhatsAppLink({
    message: "Olá! Vi a vitrine do site e gostaria de conhecer as opções atuais de Spitz Alemão Anão.",
    utmSource: "site",
    utmMedium: "catalog_empty",
    utmCampaign: "filhotes",
  });
  const waEmpty = useWhatsAppLink(baseWaEmpty);

  return (
    <>
      {/* Page hero */}
      <div className="bg-[var(--brand)] px-5 py-6 text-center sm:px-8 sm:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Criação responsável · Bragança Paulista, SP</p>
        <HeroHeading className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">
          Filhotes de Spitz Alemão Anão
        </HeroHeading>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/70">
          Cada filhote sai com registro oficial, consulta veterinária, hemograma completo e mentoria pós-venda. Saúde documentada, sem surpresas.
        </p>
        <a href={waEmpty} target="_blank" rel="noopener noreferrer" data-wa-placement="hero" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <WhatsAppIcon className="h-5 w-5" aria-hidden="true" /> Consultar opções atuais
        </a>
      </div>

    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="mb-6 space-y-3 sm:mb-8">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <label htmlFor="catalog-query" className="block text-lg font-semibold text-zinc-900">O que você procura?</label>
          <p id="catalog-query-help" className="mt-2 text-sm text-zinc-700">Busque por cor, sexo ou valor publicado. Exemplo: fêmea branca até R$ 7.500. Você também pode combinar os filtros abaixo.</p>
          <input id="catalog-query" type="search" maxLength={240} value={query}
            onChange={(event) => setQuery(event.target.value)} aria-describedby="catalog-query-help catalog-query-result"
            placeholder="Quero uma fêmea branca" className="mt-4 min-h-12 w-full rounded-xl border border-zinc-400 bg-white px-4 py-3 text-base text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700" />
          <p id="catalog-query-result" role="status" aria-live="polite" className="mt-3 text-sm text-zinc-700">
            {parsedQuery.unsupported ? "Não consegui interpretar esse pedido. Tente uma cor, sexo ou valor máximo, ou use os filtros. "
              : query.trim() ? `${filtered.length} referência(s) na vitrine para esse pedido. ` : ""}
            A vitrine não confirma estoque. Consulte a disponibilidade atual pelo WhatsApp.
          </p>
          {parsedQuery.topic && (
            <p className="mt-3 text-sm text-zinc-700">
              {parsedQuery.topic === "location" ? "Estamos em Bragança Paulista/SP. Combine os detalhes de uma visita com a equipe. "
                : parsedQuery.topic === "reservation" ? "Confirme o filhote e as condições de reserva com a equipe antes de pagar. "
                : "Consulte com a equipe os documentos e registros do filhote específico. "}
              <a href={parsedQuery.topic === "location" ? "/contato" : parsedQuery.topic === "reservation" ? "/reserve-seu-filhote" : "/blog/documentacao-registro-spitz-alemao"} className="font-semibold text-emerald-800 underline">Saiba mais</a>
            </p>
          )}
          {query.trim() && <a href={waEmpty} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center font-semibold text-emerald-800 underline">Confirmar opções atuais pelo WhatsApp</a>}
        </div>
        {/* Aviso de vitrine — curto, no lugar onde ficava o contador de estoque */}
        <p className="text-sm leading-relaxed text-zinc-500">
          Estas são fotos reais das combinações de cor e sexo com que trabalhamos.{" "}
          <span className="font-medium text-zinc-700">
            Consulte as opções atuais pelo WhatsApp.
          </span>
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
            aria-pressed={!filterColor}
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
              aria-pressed={filterColor === c}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                COLOR_LABELS[c] ? "" : "capitalize"
              } ${
                filterColor === c ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {COLOR_LABELS[c] ?? c}
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
              aria-pressed={filterSex === o.value}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                filterSex === o.value ? "bg-violet-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {o.label}
            </button>
          ))}
          {/* Limpar */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 rounded-full border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-100 active:scale-95"
            >
              ✕ Limpar
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {/* Cada card traz o nome do filhote em <h3>. Sem este rótulo o
          documento pulava de h1 direto para h3 e o leitor de tela perdia o
          nível intermediário. É sr-only porque a barra de filtros logo acima
          já identifica a lista visualmente — o desenho não muda. */}
      <h2 className="sr-only">Vitrine de filhotes</h2>
      {filtered.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
                priceCents={puppy.priceCents}
                price_cents={puppy.price_cents}
                images={puppy.images}
                description={puppy.description}
                priority={i === 0}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-zinc-200 py-16 text-center">
          <p className="text-zinc-500">
            {hasFilters
              ? "Nenhuma combinação corresponde a esses filtros."
              : "A vitrine está sendo atualizada."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
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
