import Link from "next/link";

import { SEARCH_CLUSTERS, topicsForCluster, type SearchCluster } from "@/content/search-topics";

/** Navegação renderizada no servidor: os links existem mesmo sem JavaScript. */
export function SearchTopicDirectory({ clusters, currentPath }: { clusters?: readonly SearchCluster[]; currentPath?: string }) {
  const groups = SEARCH_CLUSTERS.filter((group) => !clusters || clusters.includes(group.id));
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.id} id={`temas-${group.id}`} aria-labelledby={`heading-${group.id}`} className="scroll-mt-24">
          <h2 id={`heading-${group.id}`} className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{group.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">{group.description}</p>
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
        </section>
      ))}
    </div>
  );
}
