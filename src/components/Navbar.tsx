"use client";

import * as Dialog from "@radix-ui/react-dialog";
import classNames from "classnames";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { routes, type AppRoutes } from "@/lib/route";

const navLinks: { label: string; href: AppRoutes }[] = [
  { label: "Inicio", href: routes.home },
  { label: "Filhotes", href: routes.filhotes },
  { label: "Sobre", href: routes.sobre },
  { label: "Blog", href: routes.blog },
  { label: "Contato", href: routes.contato },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";

  const [hash, setHash] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setHash(new URL(window.location.href).searchParams.get("h"));
  }, [pathname]);

  const close = () => setOpen(false);

  const isActive = (href: string, current: string, h: string | null) => {
    if (href === "/") return current === "/";
    if (href === "/filhotes" && current.startsWith("/filhote/")) return true;
    if (href === "/blog" && current.startsWith("/blog/")) return true;
    return current === href || current.startsWith(`${href}/`) || h === href.replace("/", "");
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  // Prefers-reduced-motion agora tratado via classes CSS (motion-reduce:*), sem JS.

  useEffect(() => {
    if (open) setTimeout(() => firstLinkRef.current?.focus(), 10);
  }, [open]);

  return (
    <header
      data-site-shell="navbar"
      className="fixed inset-x-0 top-0 z-50 w-full border-b border-zinc-200 bg-white text-zinc-900 shadow-sm"
      role="banner"
    >
      <nav
        className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Navegacao principal"
      >
        <Link
          href={routes.home}
          className="flex min-w-0 max-w-[70%] items-center gap-2 text-base font-semibold tracking-tight text-inherit transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 rounded px-1 min-h-[48px] sm:max-w-none"
          aria-label="By Imperio Dog - Pagina inicial"
        >
          <Image src="/byimperiologo.svg" alt="Logotipo By Imperio Dog" width={32} height={32} className="h-8 w-8" />
          <div className="flex flex-col leading-tight">
            <span className="truncate">By Imperio Dog</span>
            <span className="hidden text-xs font-normal text-[var(--text-muted)] sm:block">Criação especializada em Spitz Alemão Anão Lulu da Pomerânia</span>
          </div>
        </Link>

        <div className="hidden items-center gap-6 lg:flex" role="menubar">
          {navLinks.map((link) => {
            const active = isActive(link.href, pathname, hash);
            const cls = classNames(
              "relative min-h-[48px] flex items-center px-2 text-[15px] font-medium tracking-wide transition-all duration-200 ease-in-out hover:-translate-y-0.5",
              active
                ? "text-[var(--brand)] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[var(--brand)]"
                : "text-zinc-700 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 rounded"
            );
            return (
              <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={cls} role="menuitem">
                <span className="whitespace-nowrap">{link.label}</span>
              </Link>
            );
          })}

          {(() => {
            const trimmed = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
            const waHref = trimmed
              ? `https://wa.me/${trimmed}`
              : process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/";
            return (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                title="Atendimento humano com carinho"
                aria-label="Falar com equipe via WhatsApp"
              >
                <WAIcon size={18} className="h-[18px] w-[18px]" aria-hidden />
                WhatsApp
              </a>
            );
          })()}
        </div>

        <div className="lg:hidden">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" aria-hidden />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <div
                  className="fixed inset-0 z-[60] bg-black/40 opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100 motion-reduce:transition-none"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild onEscapeKeyDown={close}>
                <aside
                  className="fixed inset-y-0 right-0 z-[61] w-full max-w-[86%] bg-white text-zinc-900 shadow-2xl outline-none translate-x-full data-[state=open]:translate-x-0 transition-transform duration-200 ease-out motion-reduce:transition-none"
                  role="dialog"
                  aria-label="Menu"
                  id="menu-mobile"
                >
                  <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200">
                    <span className="text-sm font-semibold text-zinc-700">Menu</span>
                    <Dialog.Close asChild>
                      <button
                        className="rounded-full p-2 min-h-[48px] min-w-[48px] flex items-center justify-center hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                        aria-label="Fechar menu"
                      >
                        <X className="h-6 w-6" aria-hidden />
                      </button>
                    </Dialog.Close>
                  </div>
                  <nav className="px-2 pb-6 pt-4" aria-label="Menu mobile">
                    <ul className="flex flex-col gap-1" role="menu">
                      {navLinks.map((link) => {
                        const active = isActive(link.href, pathname, hash);
                        const cls = classNames(
                          "relative rounded-md px-4 py-3 text-base font-medium min-h-[48px] flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2",
                          active ? "bg-zinc-100 text-[var(--brand)]" : "text-zinc-700 hover:bg-zinc-50"
                        );
                        return (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={close}
                              aria-current={active ? "page" : undefined}
                              className={cls}
                              role="menuitem"
                              ref={firstLinkRef}
                            >
                              {link.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="px-4 pt-6">
                      {(() => {
                        const trimmed = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
                        const waHref = trimmed
                          ? `https://wa.me/${trimmed}`
                          : process.env.NEXT_PUBLIC_WA_LINK || "https://wa.me/";
                        return (
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={close}
                            className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 min-h-[48px] w-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                            title="Atendimento humano com carinho"
                            aria-label="Abrir conversa no WhatsApp"
                          >
                            <WAIcon size={18} className="h-[18px] w-[18px]" aria-hidden />
                            WhatsApp
                          </a>
                        );
                      })()}
                    </div>
                  </nav>
                </aside>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </nav>
      <div className="sr-only" aria-live="polite">{open ? "Menu aberto" : "Menu fechado"}</div>
    </header>
  );
}

