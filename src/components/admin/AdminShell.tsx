"use client";
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { useTheme } from '../../../design-system/theme-provider';

type NavItem = { href: string; label: string };

// Navegação enxuta e harmonizada: itens de primeiro nível apenas para áreas principais.
// Seções específicas do Blog ficam em submenus dedicados (ver páginas que os utilizam).
const nav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/puppies', label: 'Filhotes' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/pixels', label: 'Pixels' },
  { href: '/admin/config', label: 'Configurações' },
];

export function AdminShell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = () => setPrefersReduced(mq.matches);
    listener();
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[15px] leading-relaxed text-[var(--text)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 rounded bg-[var(--accent)] px-3 py-2 text-[var(--accent-contrast)]"
      >
        Pular para o conteúdo
      </a>

      {/* Barra superior */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen((value) => !value)}
            aria-label="Abrir menu"
            aria-expanded={open}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]"
          >
            ☰
          </button>
          <span className="text-sm font-semibold tracking-tight text-[var(--accent)]">Admin · By Imperio Dog</span>
        </div>

        <nav className="hidden md:flex items-center gap-1" aria-label="Seções">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                  active
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline-flex rounded-full bg-[var(--success)]/15 px-2 py-1 text-[11px] text-[var(--success)]">
            IA ativa
          </span>
          <button
            onClick={toggle}
            className="inline-flex h-8 items-center rounded-lg border border-[var(--border)] px-3 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Alternar tema"
          >
            {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          </button>
        </div>
      </header>

      <div className="relative flex min-h-[calc(100vh-56px)]">
        <AnimatePresence>
          {open && (
            <motion.aside
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{ type: prefersReduced ? 'tween' : 'spring', duration: prefersReduced ? 0.2 : 0.5, damping: 22 }}
              className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-[var(--border)] bg-[var(--surface)] px-3 py-4 shadow-lg lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-[var(--accent)]">Navegação</span>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Menu mobile">
                {nav.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={toggle}
                className="mt-2 w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-2)]"
              >
                Tema: {theme === 'light' ? 'Claro' : 'Escuro'}
              </button>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
          <main id="main" className="focus:outline-none flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto px-5 py-6">
              <div className="mx-auto w-full max-w-[1500px] space-y-8">{children}</div>
            </div>
          </main>
          {right && (
            <aside className="hidden xl:block w-88 shrink-0 border-l border-[var(--border)] bg-[var(--surface)] px-5 py-6 overflow-y-auto">
              {right}
            </aside>
          )}
        </div>
      </div>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[11px] text-[var(--text-muted)]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <span>© {new Date().getFullYear()} By Imperio Dog</span>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[var(--text)]">
            Suporte
          </a>
        </div>
      </footer>
    </div>
  );
}
