"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState } from "react";

const CURRENT_YEAR = new Date().getFullYear();

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { routes, type AppRoutes } from "@/lib/route";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// Links simples da nav principal
const NAV_LINKS: { label: string; href: AppRoutes | string }[] = [
  { label: "Início",    href: routes.home },
  { label: "Filhotes",  href: routes.filhotes },
  { label: "Galeria",   href: "/galeria" },
  { label: "Blog",      href: routes.blog },
  { label: "Processo",  href: routes.sobre },
  { label: "FAQ",       href: "/faq-do-tutor" },
  { label: "Contato",   href: routes.contato },
];

// Dropdown "Raça" — páginas informacionais e de intenção
const RACA_LINKS = [
  { label: "Spitz Alemão Anão",        href: "/spitz-alemao",              desc: "Raça completa: origem, temperamento, cores" },
  { label: "Lulu da Pomerânia",        href: "/lulu-da-pomerania",         desc: `Guia completo + preços ${CURRENT_YEAR}` },
  { label: "Pomeranian",               href: "/pomeranian",                desc: "= Lulu da Pomerânia = Spitz Alemão Anão" },
  { label: "Filhote de Spitz Alemão",  href: "/filhote-de-spitz-alemao",   desc: "Como escolher e cuidar" },
  { label: "Spitz Alemão Preto",       href: "/spitz-alemao-preto",        desc: "Cor rara — disponibilidade" },
  { label: "Spitz Alemão Baby Face",   href: "/spitz-alemao-baby-face",    desc: "O que é, riscos e mitos" },
  { label: "Tabela de Preços",         href: "/preco-spitz-anao",          desc: `Valores por cor e sexo — ${CURRENT_YEAR}` },
  { label: "Como Comprar",             href: "/comprar-spitz-anao",        desc: "Guia passo a passo seguro" },
  { label: "Criador Confiável",        href: "/criador-spitz-confiavel",   desc: "Como identificar procedência" },
] as const;

export default function Header() {
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [racaOpen, setRacaOpen] = useState(false);
  const [mobileRacaOpen, setMobileRacaOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRacaEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setRacaOpen(true);
  };
  const handleRacaLeave = () => {
    closeTimeout.current = setTimeout(() => setRacaOpen(false), 180);
  };

  const whatsappLink = useMemo(
    () =>
      buildWhatsAppLink({
        message: "Olá! Quero conversar sobre a disponibilidade dos Spitz Alemão Anão da By Império Dog.",
        utmSource: "site",
        utmMedium: "header",
        utmCampaign: "header_whatsapp",
        utmContent: "hero_nav",
      }),
    []
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isRacaActive = RACA_LINKS.some((l) => pathname.startsWith(l.href));

  return (
    <>
      <a
        href="#conteudo-principal"
        className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-lg transition focus:translate-y-0 focus:outline-none"
      >
        Ir para o conteúdo
      </a>

      <header className="sticky top-0 z-50 border-b border-emerald-100 bg-white text-zinc-900 shadow-sm" role="banner">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">

          {/* Logo */}
          <Link
            href={routes.home}
            className="flex min-h-[48px] items-center gap-2 rounded-full px-2 text-base font-semibold tracking-tight text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            aria-label="By Império Dog — página inicial"
          >
            <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">By Império Dog</span>
            <span className="hidden text-xs font-medium text-zinc-500 sm:block">Spitz Alemão Anão</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">

            {/* Dropdown Raça */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleRacaEnter}
              onMouseLeave={handleRacaLeave}
            >
              <button
                type="button"
                aria-expanded={racaOpen}
                aria-haspopup="menu"
                onClick={() => setRacaOpen((v) => !v)}
                className={`flex min-h-[44px] items-center gap-1 rounded-full px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  isRacaActive ? "text-brand" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Raça
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${racaOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {/* Dropdown panel */}
              {racaOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-1 w-72 rounded-2xl border border-zinc-100 bg-white p-2 shadow-xl"
                  onMouseEnter={handleRacaEnter}
                  onMouseLeave={handleRacaLeave}
                >
                  {RACA_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setRacaOpen(false)}
                      className={`flex flex-col rounded-xl px-3 py-2.5 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                        isActive(link.href) ? "bg-emerald-50 text-brand" : ""
                      }`}
                    >
                      <span className="text-sm font-semibold text-zinc-900">{link.label}</span>
                      <span className="text-xs text-zinc-400">{link.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Links simples */}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-h-[44px] items-center rounded-full px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                  isActive(link.href)
                    ? "text-brand"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={whatsappLink}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
              Conversar agora
            </a>
          </div>

          {/* Mobile hamburger */}
          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-zinc-800 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 lg:hidden"
                aria-label="Abrir menu de navegação"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" aria-hidden="true" />
              <Dialog.Content
                className="fixed inset-x-0 top-0 z-50 max-h-[90dvh] overflow-y-auto rounded-b-3xl border-b border-emerald-100 bg-white px-5 pb-6 pt-4 shadow-2xl"
                aria-label="Menu de navegação"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-700">Menu</span>
                  <Dialog.Close
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-white text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    aria-label="Fechar menu"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </Dialog.Close>
                </div>

                <nav className="mt-4 space-y-1.5" aria-label="Navegação mobile">
                  {/* Links simples */}
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={`flex min-h-[48px] items-center rounded-2xl border px-4 text-sm font-semibold transition ${
                        isActive(link.href)
                          ? "border-brand bg-brand/5 text-brand"
                          : "border-transparent text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {/* Seção Raça expansível */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setMobileRacaOpen((v) => !v)}
                      aria-expanded={mobileRacaOpen}
                      className={`flex w-full min-h-[48px] items-center justify-between rounded-2xl border px-4 text-sm font-semibold transition ${
                        isRacaActive
                          ? "border-brand bg-brand/5 text-brand"
                          : "border-transparent text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50"
                      }`}
                    >
                      Sobre a Raça
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${mobileRacaOpen ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>

                    {mobileRacaOpen && (
                      <div className="mt-1.5 space-y-1 pl-3">
                        {RACA_LINKS.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => { setMobileOpen(false); setMobileRacaOpen(false); }}
                            className={`flex min-h-[44px] items-center rounded-xl border px-4 text-sm font-medium transition ${
                              isActive(link.href)
                                ? "border-brand/30 bg-brand/5 text-brand"
                                : "border-transparent text-zinc-600 hover:border-emerald-100 hover:bg-emerald-50"
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </nav>

                <div className="mt-5">
                  <a
                    href={whatsappLink}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                    Conversar no WhatsApp
                  </a>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

        </div>
      </header>
    </>
  );
}
