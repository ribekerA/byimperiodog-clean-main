// app/(admin)/admin/_components/AdminNav.tsx
 'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';
import clsx from 'clsx';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV: { href: Route; label: string }[] = [
  { href: '/admin/dashboard' as Route, label: 'Dashboard' },
  { href: '/admin/puppies' as Route, label: 'Gerenciar Filhotes' },
  { href: '/admin/blog' as Route, label: 'Gerenciar Blog' },
  { href: '/admin/blog/analytics' as Route, label: 'Blog Analytics' },
  { href: '/admin/config' as Route, label: 'Config' },
];

export default function AdminNav() {
  const [pathname, setPathname] = useState<string | undefined>(typeof window !== 'undefined' ? window.location.pathname : undefined);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPop = () => setPathname(window.location.pathname);
    setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : (null as any);
      const t = ctrl ? setTimeout(() => ctrl.abort(), 1500) : null;
      await fetch('/api/admin/logout', {
        method: 'GET',
        cache: 'no-store',
        // @ts-ignore keepalive é suportado no browser
        keepalive: true,
        signal: (ctrl ? (ctrl as AbortController).signal : undefined) as any,
      });
      if (t) clearTimeout(t as any);
    } catch {}
    // navega direto para o login e força revalidação do layout
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <>
      {/* Container centralizado e responsivo */}
      <div className="w-full border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="flex flex-wrap items-center justify-center gap-2 py-2 overflow-x-auto" aria-label="Navegação administrativa">
          {NAV.map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'text-zinc-700 hover:bg-zinc-100'
                )}
              >
                {n.label}
              </Link>
            );
          })}

          {/* sair com confirmação */}
            <AlertDialog.Root>
              <AlertDialog.Trigger asChild>
                <button
                  type="button"
                  className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100"
                >
                  Sair
                </button>
              </AlertDialog.Trigger>
              <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
                <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl focus:outline-none">
                  <AlertDialog.Title className="text-lg font-semibold text-zinc-900">
                    Confirmar saída
                  </AlertDialog.Title>
                  <AlertDialog.Description className="mt-2 text-sm text-zinc-600">
                    Tem certeza que deseja sair do painel administrativo? Você precisará fazer login novamente para acessar.
                  </AlertDialog.Description>
                  <div className="mt-6 flex gap-3 justify-end">
                    <AlertDialog.Cancel asChild>
                      <button
                        type="button"
                        className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                      >
                        Cancelar
                      </button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action asChild>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-70"
                      >
                        {isLoggingOut ? 'Saindo...' : 'Sim, sair'}
                      </button>
                    </AlertDialog.Action>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Portal>
            </AlertDialog.Root>
          </nav>
        </div>
      </div>

      {isLoggingOut && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/80 backdrop-blur-sm" aria-live="polite" aria-busy>
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-200/60"></div>
              <Image src="/spitz-hero-mobile.png" alt="" className="relative rounded-full object-cover ring-2 ring-emerald-500/30" width={96} height={96} />
            </div>
            <div className="flex items-center gap-2 text-2xl" aria-hidden>
              <span className="paw">{"\uD83D\uDC3E"}</span>
              <span className="paw">{"\uD83D\uDC3E"}</span>
              <span className="paw">{"\uD83D\uDC3E"}</span>
            </div>
          </div>
          <style jsx>{`
            @keyframes paw-walk {
              0% { opacity: 0.2; transform: translateY(6px) scale(0.9) rotate(-10deg); }
              50% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
              100% { opacity: 0.2; transform: translateY(-6px) scale(0.9) rotate(10deg); }
            }
            .paw { animation: paw-walk 900ms infinite ease-in-out; }
            .paw:nth-child(2) { animation-delay: 150ms; }
            .paw:nth-child(3) { animation-delay: 300ms; }
          `}</style>
        </div>
      )}
    </>
  );
}
