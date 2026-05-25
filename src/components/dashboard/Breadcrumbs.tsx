"use client";
import Link from 'next/link';
import * as React from 'react';

function segmentLabel(seg:string){
  if(!seg) return '';
  return seg.replace(/[-_]/g,' ').replace(/\b\w/g, c=> c.toUpperCase());
}

export function Breadcrumbs({ path }:{ path:string }){
  const parts = path.split('?')[0].split('#')[0].split('/').filter(Boolean);
  const crumbs = parts.slice(1); // remove 'admin'
  return (
    <nav aria-label="Breadcrumb" className="text-[11px] font-medium text-[var(--text-muted)]">
      <ol className="flex items-center gap-1">
        <li><Link href="/admin/dashboard" className="hover:text-[var(--text)] focus-visible:underline">Início</Link><span className="mx-1">/</span></li>
        {crumbs.length===0 && <li className="text-[var(--text)]">Dashboard</li>}
        {crumbs.map((c,i)=> {
          const href = '/'+parts.slice(0,i+2).join('/');
          const last = i===crumbs.length-1;
          return (
            <li key={href} className="flex items-center gap-1">
              {!last && <Link href={href} className="hover:text-[var(--text)] focus-visible:underline">{segmentLabel(c)}</Link>}
              {last && <span className="text-[var(--text)]" aria-current="page">{segmentLabel(c)}</span>}
              {!last && <span className="/">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
