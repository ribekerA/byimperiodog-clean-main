"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
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
  { label: "Spitz Alemão Anão (Lulu da Pomerânia)",        href: "/spitz-alemao",              desc: "Raça completa: origem, temperamento, cores" },
  { label: "Lulu da Pomerânia",        href: "/lulu-da-pomerania",         desc: "Guia completo + preços" },
  { label: "Pomeranian",               href: "/pomeranian",                desc: "= Lulu da Pomerânia = Spitz Alemão Anão" },
  { label: "Filhote de Spitz Alemão (Lulu da Pomerânia)",  href: "/filhote-de-spitz-alemao",   desc: "Como escolher e cuidar" },
  { label: "Spitz Alemão (Lulu da Pomerânia) Branco",      href: "/spitz-alemao-branco",       desc: "Diferenças do creme claro" },
  { label: "Spitz Alemão (Lulu da Pomerânia) Preto",       href: "/spitz-alemao-preto",        desc: "Preço e disponibilidade" },
  { label: "Spitz Alemão (Lulu da Pomerânia) Baby Face",   href: "/spitz-alemao-baby-face",    desc: "O que é, riscos e mitos" },
  { label: "Como Comprar",             href: "/comprar-spitz-anao",        desc: "Guia passo a passo seguro" },
  { label: "Criador Confiável",        href: "/criador-spitz-confiavel",   desc: "Como identificar procedência" },
] as const;

export default function Header() {
  const pathname = usePathname() || "/";
  // Na home o cabeçalho é o do print: sobre a fotografia, sem fundo.
  const ehHome = pathname === "/";
  // Todas as outras usam o da vitrine, aprovado em 06/11/2026: marca à esquerda,
  // menu dourado à direita. Em /filhotes ele fica sobre a foto; nas demais, fixo.
  const ehVitrine = pathname === "/filhotes";
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

  const baseWhatsAppLink = useMemo(
    () =>
      buildWhatsAppLink({
        message: "Olá! Quero conversar sobre a disponibilidade dos Spitz Alemão Anão (Lulu da Pomerânia) da By Império Dog.",
        utmSource: "site",
        utmMedium: "header",
        utmCampaign: "header_whatsapp",
        utmContent: "hero_nav",
      }),
    []
  );
  const whatsappLink = useWhatsAppLink(baseWhatsAppLink);

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

      <header className={`hm-cabecalho${ehHome ? "" : " vt-cabecalho"}${ehHome || ehVitrine ? "" : " pg-cabecalho"}`} role="banner">
        <div className="hm-cabecalho-miolo mx-auto flex w-full max-w-7xl items-center justify-between gap-2 sm:gap-4">

          {/* Logo — sem aria-label de propósito. O rótulo anterior ("By Império
              Dog — página inicial") substituía o texto visível do link, que
              inclui "Sementinhas de Amor"; por WCAG 2.5.3 o nome acessível
              precisa conter o texto visível, e não continha. Sem o atributo, o
              nome passa a ser o próprio conteúdo do link. */}
          <Link
            href={routes.home}
            className="hm-logo order-2 flex min-h-[48px] items-center gap-2 rounded-full px-2 text-base font-semibold tracking-tight text-[var(--text-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-dark)] lg:order-1"
          >
            <Image
              src="/images/home/coroa.webp"
              alt=""
              width={230}
              height={148}
              unoptimized
              loading="eager"
              className="hm-coroa"
            />
            <span>
              <span className="hm-marca">By Império Dog<sup>®</sup></span>{" "}
              <span className="hm-lema">Sementinhas de Amor</span>
            </span>
          </Link>

          {/* Selo "Desde 2013" entre louros: só na home, no celular. As demais páginas
              seguem o cabeçalho da vitrine, sem selo; o ano segue no rodapé. */}
          {ehHome ? (
            <span className="hm-desde order-3 lg:hidden">
              <Image src="/images/home/louro-esq.webp" alt="" width={80} height={136} unoptimized loading="eager" />
              <span>Desde{" "}<span className="hm-desde-ano">2013</span></span>
              <Image src="/images/home/louro-dir.webp" alt="" width={80} height={136} unoptimized loading="eager" />
            </span>
          ) : null}

          {/* Desktop nav */}
          <nav className="order-4 hidden items-center gap-1 lg:order-2 lg:flex" aria-label="Navegação principal">

            {/* Dropdown Raça */}
            {/* Hover apenas mantém o menu aberto; o botão abaixo oferece toda a interação por teclado. */}
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
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
                  isRacaActive ? "text-[var(--accent)]" : "text-white/70 hover:text-white"
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
                  tabIndex={-1}
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
                      <span className="text-xs text-zinc-500">{link.desc}</span>
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
                    ? "text-[var(--accent)]"
                    : "text-white/70 hover:text-white"
                }`}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="order-5 hidden items-center gap-3 lg:order-3 lg:flex">
            <a
              href={whatsappLink}
              data-wa-placement="header"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-bold text-[var(--accent-foreground)] shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-dark)]"
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
                className="hm-menu order-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-dark)] lg:hidden"
                aria-label="Abrir menu de navegação"
                aria-expanded={mobileOpen}
              >
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
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
                    data-wa-placement="header"
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
