"use client";
import clsx from 'classnames';
import React, { useEffect, useState } from 'react';

import type { TocItem } from '@/lib/blog/mdx/toc';

interface TOCProps { toc: TocItem[]; className?: string; labelClassName?: string; minDepth?: number; maxDepth?: number }

function flatten(items: TocItem[]): TocItem[] { return items.flatMap(i => [i, ...flatten(i.children)]); }

export default function TOC({ toc, className, labelClassName, minDepth = 2, maxDepth = 4 }: TOCProps){
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
    <nav aria-label="Índice" className={clsx('sticky top-28 block w-60 text-sm max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin', className)}>
      <div className={clsx('mb-3 text-xs font-bold uppercase tracking-[0.2em] text-text-muted', labelClassName)}>No artigo</div>
      <ul className="space-y-1 border-l border-border pl-3">
        {flat.map(i => (
          <li key={i.id} className={clsx('transition-colors', active===i.id ? 'text-brand font-medium' : 'text-text-soft hover:text-text')}>
            <a href={`#${i.id}`} className={clsx('block py-0.5 line-clamp-2 leading-snug', i.depth === 3 && 'ml-3 text-[12px]')} onClick={(e)=>{
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
