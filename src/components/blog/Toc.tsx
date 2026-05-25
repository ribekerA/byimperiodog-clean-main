"use client";
import clsx from 'classnames';
import React, { useEffect, useState } from 'react';

import type { TocItem } from '@/lib/blog/mdx/toc';

interface TOCProps { toc: TocItem[]; className?: string; minDepth?: number; maxDepth?: number }

function flatten(items: TocItem[]): TocItem[] { return items.flatMap(i => [i, ...flatten(i.children)]); }

export default function TOC({ toc, className, minDepth = 2, maxDepth = 4 }: TOCProps){
  const flat = flatten(toc).filter(i => i.depth >= minDepth && i.depth <= maxDepth);
  const [active, setActive] = useState<string|null>(null);

  useEffect(()=>{
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '0px 0px -60% 0px', threshold: [0,1] });
    flat.forEach(i => {
      const el = document.getElementById(i.id);
      if(el) obs.observe(el);
    });
    return ()=> obs.disconnect();
  },[flat]);

  if(!flat.length) return null;
  return (
    <nav aria-label="Índice" className={clsx('sticky top-28 hidden xl:block w-60 text-sm max-h-[80vh] overflow-auto pr-2', className)}>
      <div className="mb-2 font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">No artigo</div>
      <ul className="space-y-1 border-l pl-3">
        {flat.map(i => (
          <li key={i.id} className={clsx('transition-colors', active===i.id ? 'text-emerald-600 font-medium' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300')}>
            <a href={`#${i.id}`} className={clsx('block line-clamp-2', i.depth === 3 && 'ml-3 text-[13px]')} onClick={(e)=>{
              e.preventDefault();
              const el = document.getElementById(i.id);
              if(el) {
                history.replaceState(null, '', `#${i.id}`);
                window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
              }
            }}>{i.value}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
