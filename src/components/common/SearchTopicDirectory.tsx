import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { SEARCH_CLUSTERS, topicsForCluster, type SearchCluster } from "@/content/search-topics";

/**
 * Navegação renderizada no servidor: os links existem mesmo sem JavaScript.
 *
 * `variante="lista"` (usada em /filhotes desde 17/11/2026): os temas viram uma
 * lista em duas colunas, título e seta, com a descrição em letra menor. Em
 * caixas iguais, treze temas tinham o mesmo peso e o bloco parecia um mapa do
 * site no meio da vitrine. Em /guias, que é a página dos temas, ficam as caixas.
 */
export function SearchTopicDirectory({
  clusters,
  currentPath,
  variante = "caixas",
}: {
  clusters?: readonly SearchCluster[];
  currentPath?: string;
  variante?: "caixas" | "lista";
}) {
  const groups = SEARCH_CLUSTERS.filter((group) => !clusters || clusters.includes(group.id));
  const lista = variante === "lista";
  return (
    <div className={lista ? "space-y-12" : "space-y-10"}>
      {groups.map((group) => (
        <section key={group.id} id={`temas-${group.id}`} aria-labelledby={`heading-${group.id}`} className="scroll-mt-24">
          <h2 id={`heading-${group.id}`} className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{group.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">{group.description}</p>
          {lista ? (
            <ul className="mt-5 grid border-t border-[#d4a84b]/30 sm:grid-cols-2 sm:gap-x-10">
              {topicsForCluster(group.id).filter((topic) => topic.href !== currentPath).map((topic) => (
                <li key={topic.id} className="border-b border-[#d4a84b]/30">
                  <Link
                    href={topic.href}
                    prefetch={false}
                    className="group flex min-h-11 items-start justify-between gap-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <span>
                      <span className="block text-[15px] font-semibold text-zinc-900 group-hover:text-emerald-700">{topic.label}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-zinc-500">{topic.description}</span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#9a7426] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topicsForCluster(group.id).filter((topic) => topic.href !== currentPath).map((topic) => (
                <li key={topic.id}>
                  <Link href={topic.href} prefetch={false} className="group block h-full rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700">{topic.label}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">{topic.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
