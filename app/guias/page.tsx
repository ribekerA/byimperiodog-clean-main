import type { Metadata } from "next";
import Link from "next/link";

import { guides } from "@/content/guides";

export const metadata: Metadata = {
  title: "Guias sobre Spitz Alemão Anão | By Império Dog",
  description:
    "Guias completos sobre Spitz Alemão Anão (Lulu da Pomerânia): como escolher, alimentação, cuidados, diferenças de cor e sexo. Conteúdo de quem cria há mais de 10 anos.",
  alternates: { canonical: "/guias" },
};

// Ícone e cor por slug
const GUIDE_META: Record<string, { icon: string; badge: string; badgeColor: string }> = {
  "como-escolher-spitz-alemao-anao": {
    icon: "🏅",
    badge: "Guia essencial",
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
  "spitz-alemao-anao-alimentacao": {
    icon: "🥩",
    badge: "Saúde",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  "spitz-alemao-anao-vs-lulu-pomerania": {
    icon: "🐾",
    badge: "Raça",
    badgeColor: "bg-[var(--accent)]/20 text-amber-800",
  },
  "cuidados-basicos-spitz-alemao-anao": {
    icon: "✂️",
    badge: "Cuidados",
    badgeColor: "bg-purple-100 text-purple-800",
  },
  "preparando-chegada-filhote-spitz": {
    icon: "🏡",
    badge: "Chegada",
    badgeColor: "bg-rose-100 text-rose-800",
  },
  "quanto-custa-ter-spitz-alemao-anao": {
    icon: "💰",
    badge: "Custo real",
    badgeColor: "bg-yellow-100 text-yellow-800",
  },
};

export default function GuiasIndexPage() {
  return (
    <main>
      {/* Hero */}
      <div className="bg-[var(--brand)] px-5 py-14 text-center sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
          Conteúdo educativo · By Império Dog
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Guias sobre Spitz Alemão Anão
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70">
          Tudo que você precisa saber antes de levar um filhote para casa — escrito por quem cria há mais de 10 anos.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400" aria-hidden="true">✓</span>
            {guides.length} guias completos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400" aria-hidden="true">✓</span>
            Atualizados em 2025
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400" aria-hidden="true">✓</span>
            Escritos pela criadora
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="bg-[var(--bg)] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => {
              const meta = GUIDE_META[guide.slug] ?? {
                icon: "📖",
                badge: "Guia",
                badgeColor: "bg-zinc-100 text-zinc-700",
              };

              return (
                <li key={guide.slug}>
                  <Link
                    href={`/guias/${guide.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                  >
                    {/* Colored header strip */}
                    <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50 px-5 py-4">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm"
                        aria-hidden="true"
                      >
                        {meta.icon}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.badgeColor}`}
                      >
                        {meta.badge}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <h2 className="text-base font-bold leading-snug text-zinc-900 transition group-hover:text-emerald-700">
                        {guide.title}
                      </h2>
                      <p className="line-clamp-3 text-sm leading-relaxed text-zinc-500">
                        {guide.excerpt}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {guide.readingMinutes} min de leitura
                        </span>
                        <span className="font-medium text-emerald-600 transition group-hover:text-emerald-700">
                          Ler guia →
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Bottom CTA */}
          <div className="mt-14 overflow-hidden rounded-2xl bg-[var(--brand)] px-8 py-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
              Pronto para dar o próximo passo?
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Converse com a criadora
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
              Tire todas as suas dúvidas direto com quem cria há mais de 10 anos e descubra o filhote ideal para você.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <a
                href={`https://wa.me/5511968633239?text=${encodeURIComponent("Olá! Li os guias da By Império Dog e quero saber sobre filhotes disponíveis.")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[52px] items-center gap-2.5 rounded-xl bg-emerald-600 px-7 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-500"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.859L.057 23.784a.5.5 0 0 0 .624.613l6.03-1.579A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.791-.56-5.33-1.527l-.383-.232-3.972 1.04 1.053-3.86-.254-.4A9.965 9.965 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                Falar com a criadora
              </a>
              <Link
                href="/filhotes"
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-2 border-white/20 px-7 text-sm font-semibold text-white transition hover:border-white/60"
              >
                Ver filhotes disponíveis →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
