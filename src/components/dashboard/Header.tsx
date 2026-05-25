"use client";
import { MagnifyingGlassIcon, ChevronDownIcon, ExitIcon } from '@radix-ui/react-icons';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Breadcrumbs } from './Breadcrumbs';

export function Header(){
  const pathname = usePathname();
  const router = useRouter();
  const [query,setQuery] = React.useState('');
  const [menuOpen,setMenuOpen] = React.useState(false);
  const [logoutPending, setLogoutPending] = React.useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onSubmit(e:React.FormEvent){ e.preventDefault(); /* TODO hook search */ }

  async function handleLogout(){
    if (logoutPending) return;
    setMenuOpen(false);
    setLogoutPending(true);
    try {
      await fetch('/api/admin/logout', { method: 'GET', cache: 'no-store' });
    } catch (error) {
      console.error('admin logout failed', error);
    } finally {
      router.replace('/admin/login');
      router.refresh();
      setLogoutPending(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/80" role="banner">
      <Link
        href="/admin/dashboard"
        className="group inline-flex items-center gap-2 rounded-full border border-transparent px-2 py-1 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--accent-contrast)]">BI</span>
        <span className="hidden sm:flex flex-col leading-tight">
          <span>Admin Hub</span>
          <span className="text-[11px] font-normal text-[var(--text-muted)]">By Imperio Dog</span>
        </span>
      </Link>

      <div className="hidden min-w-0 flex-1 items-center gap-4 lg:flex">
        <div className="min-w-0">
          <Breadcrumbs path={pathname} />
        </div>
        <form onSubmit={onSubmit} role="search" className="relative hidden w-72 max-w-sm xl:block">
          <label htmlFor="dash-search" className="sr-only">Buscar</label>
          <input id="dash-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar..." className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40" />
          <MagnifyingGlassIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        </form>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 pr-3 lg:flex">
          <Link href="/admin/blog/editor" className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]" prefetch>
            Novo post
          </Link>
          <Link href="/admin/blog/schedule" className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]" prefetch>
            Agenda
          </Link>
        </div>
        <button
          onClick={()=> setMenuOpen(o=>!o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          data-state={menuOpen ? 'open' : 'closed'}
          className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          type="button"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-semibold text-[var(--accent-contrast)]">BI</span>
          <span className="hidden md:inline">Voce</span>
          <ChevronDownIcon className="h-4 w-4 text-[var(--text-muted)] transition group-data-[state=open]:rotate-180" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutPending}
          className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-500/20 focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ExitIcon className="h-4 w-4" />
          <span>{logoutPending ? 'Saindo...' : 'Sair'}</span>
        </button>
        {menuOpen && (
          <motion.ul
            initial={{opacity:0, y:4}}
            animate={{opacity:1,y:0}}
            exit={{opacity:0,y:4}}
            transition={{duration:prefersReducedMotion?0:.18}}
            onMouseLeave={()=> setMenuOpen(false)}
            role="menu"
            aria-label="Menu do usuario"
            className="absolute right-4 top-14 w-48 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg"
          >
            <li><Link onClick={()=> setMenuOpen(false)} href="/admin/settings" className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)] focus-visible:bg-[var(--surface-2)]">Preferencias</Link></li>
            <li><Link onClick={()=> setMenuOpen(false)} href="/admin/support" className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)]">Ajuda</Link></li>
          </motion.ul>
        )}
      </div>
    </header>
  );
}
