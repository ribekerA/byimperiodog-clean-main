"use client";

import { useMemo, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import AvaliacoesRotativas from "@/components/reviews/AvaliacoesRotativas";
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

// Cores que o filtro oferece mesmo sem filhote publicado: a pessoa escolhe, vê que
// não há foto agora e é levada ao WhatsApp para perguntar.
const CORES_SEMPRE_NO_FILTRO = ["chocolate", "merle"];

// Catálogo das páginas regionais (SP, RJ, MG). /filhotes usa VitrineFilhotes.
export default function StaticCatalog({ puppies }: Props) {
  const [filterColor, setFilterColor] = useState("");
  const [filterSex, setFilterSex] = useState("");
  const [query, setQuery] = useState("");
  const parsedQuery = useMemo(() => parseCatalogQuery(query), [query]);
  const clearFilters = () => { setFilterColor(""); setFilterSex(""); setQuery(""); };

  const colors = useMemo(() => {
    const set = new Set<string>(CORES_SEMPRE_NO_FILTRO);
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
    message: "Olá! Vi a vitrine do site e gostaria de conhecer as opções atuais de Spitz Alemão Anão (Lulu da Pomerânia).",
    utmSource: "site",
    utmMedium: "catalog_empty",
    utmCampaign: "filhotes",
  });
  const waEmpty = useWhatsAppLink(baseWaEmpty);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="mb-6 space-y-4 sm:mb-8">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:p-6">
          <label htmlFor="catalog-query" className="titulo-editorial block text-xl text-[var(--text)]">O que você procura?</label>
          <p id="catalog-query-help" className="mt-2 text-sm text-[var(--text-muted)]">Busque por cor, sexo ou valor publicado. Exemplo: fêmea branca até R$ 6.500. Você também pode combinar os filtros abaixo.</p>
          <input id="catalog-query" type="search" maxLength={240} value={query}
            onChange={(event) => setQuery(event.target.value)} aria-describedby="catalog-query-help catalog-query-result"
            placeholder="Quero uma fêmea branca" className="mt-4 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]" />
          <p id="catalog-query-result" role="status" aria-live="polite" className="mt-3 text-sm text-[var(--text-muted)]">
            {parsedQuery.unsupported ? "Não consegui interpretar esse pedido. Tente uma cor, sexo ou valor máximo, ou use os filtros. "
              : query.trim() ? `${filtered.length} referência(s) na vitrine para esse pedido. ` : ""}
            A vitrine não confirma estoque. Consulte a disponibilidade atual pelo WhatsApp.
          </p>
          {parsedQuery.topic && (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {parsedQuery.topic === "location" ? "Estamos em Bragança Paulista/SP. Combine os detalhes de uma visita com a equipe. "
                : parsedQuery.topic === "reservation" ? "Confirme o filhote e as condições de reserva com a equipe antes de pagar. "
                : "Consulte com a equipe os documentos e registros do filhote específico. "}
              <a href={parsedQuery.topic === "location" ? "/contato" : parsedQuery.topic === "reservation" ? "/reserve-seu-filhote" : "/blog/documentacao-registro-spitz-alemao"} className="font-semibold text-[var(--marca-texto)] underline">Saiba mais</a>
            </p>
          )}
          {query.trim() && <a href={waEmpty} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center font-semibold text-[var(--marca-texto)] underline">Confirmar opções atuais pelo WhatsApp</a>}
        </div>
        {/* Aviso de vitrine — curto, no lugar onde ficava o contador de estoque */}
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Estas são fotos reais das combinações de cor e sexo com que trabalhamos.{" "}
          <span className="font-medium text-[var(--text)]">
            Consulte as opções atuais pelo WhatsApp.
          </span>
        </p>

        {/* Pills de cor — scroll horizontal no mobile. O estado ativo vem de
            aria-pressed e é pintado em .chip-filtro, não em classe condicional:
            o visual e o que o leitor de tela anuncia nunca saem de sincronia. */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filtrar por cor"
        >
          <button type="button" onClick={() => setFilterColor("")} aria-pressed={!filterColor} className="chip-filtro shrink-0">
            Todas
          </button>
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilterColor(c === filterColor ? "" : c)}
              aria-pressed={filterColor === c}
              className={`chip-filtro shrink-0 ${COLOR_LABELS[c] ? "" : "capitalize"}`}
            >
              {COLOR_LABELS[c] ?? c}
            </button>
          ))}
          {/* Separador visual */}
          <span className="mx-1 shrink-0 self-center h-5 w-px bg-[var(--border)]" aria-hidden="true" />
          {/* Sexo como pills */}
          {SEX_OPTIONS.filter((o) => o.value !== "").map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setFilterSex(filterSex === o.value ? "" : o.value)}
              aria-pressed={filterSex === o.value}
              className="chip-filtro shrink-0"
            >
              {o.label}
            </button>
          ))}
          {/* Limpar */}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-[var(--surface-2)] active:scale-95"
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
        <ul className="grade-filhotes">
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
                priority={i === 0}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-[var(--border)] py-16 text-center">
          <p className="text-[var(--text-muted)]">
            {hasFilters
              ? "Nenhuma combinação corresponde a esses filtros."
              : "A vitrine está sendo atualizada."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)]"
              >
                Limpar filtros
              </button>
            )}
            <a
              href={waEmpty}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-[var(--brand-foreground)] transition hover:brightness-110"
            >
              <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
              Vamos conversar sobre o seu novo amor
            </a>
          </div>
        </div>
      )}

      {/* Faixa de avaliacoes do pe da referencia. Depois da grade, como no
          desenho — e depois do aviso de estoque, nao antes dele. */}
      <AvaliacoesRotativas className="mt-12" />
    </section>
  );
}
