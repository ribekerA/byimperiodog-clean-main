"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const items = [
  { href:'/admin/blog', label:'Posts' },
  { href:'/admin/blog/editor', label:'Novo/Editor' },
  { href:'/admin/blog/editor/wizard', label:'Wizard IA' },
  { href:'/admin/blog/schedule', label:'Agenda' },
  { href:'/admin/blog/comments', label:'Comentários' },
  { href:'/admin/blog/analytics', label:'Analytics' },
];

export function BlogSubnav(){
  const pathname = usePathname();
  return (
    <nav aria-label="Subnavegação Blog" className="-mb-4 flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-xs md:text-[11px] rounded-t-lg">
      {items.map(it=> { const active = pathname.startsWith(it.href); return (
        <Link key={it.href} href={it.href} className={`px-3 py-1.5 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${active? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm':'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'}`}>{it.label}</Link>
      ); })}
    </nav>
  );
}
