"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  FOUNDING_YEAR,
  GOOGLE_BUSINESS_PROFILE_URL,
  GOOGLE_REVIEW_URL,
} from "@/domain/config";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { openConsentPreferences } from "@/lib/consent";
import { routes } from "@/lib/route";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const NAV_ITEMS = [
  { label: "Início", href: routes.home },
  { label: "Filhotes", href: routes.filhotes },
  { label: "Galeria de vídeos", href: "/galeria" },
  { label: "Guias", href: "/guias" },
  { label: "Blog", href: routes.blog },
  { label: "Processo", href: routes.sobre },
  { label: "Contato", href: routes.contato },
];

// /ninhadas, /spitz-alemao-preto e /spitz-alemao-baby-face estavam no sitemap
// mas nenhuma página do site linkava para elas — zero links internos apontando.
// Para o Google isso é uma página sem nenhum sinal de importância dentro do
// próprio domínio. Entram aqui porque é a lista de páginas da raça.
const RACA_ITEMS = [
  { label: "Spitz Alemão Anão", href: "/spitz-alemao" },
  { label: "Lulu da Pomerânia", href: "/lulu-da-pomerania" },
  { label: "Pomeranian", href: "/pomeranian" },
  { label: "Filhote de Spitz", href: "/filhote-de-spitz-alemao" },
  { label: "Spitz Alemão Branco", href: "/spitz-alemao-branco" },
  { label: "Spitz Alemão Preto", href: "/spitz-alemao-preto" },
  { label: "Spitz Alemão Baby Face", href: "/spitz-alemao-baby-face" },
  { label: "Ninhadas", href: "/ninhadas" },
  { label: "Tabela de Preços", href: "/preco-spitz-anao" },
  { label: "Como Comprar", href: "/comprar-spitz-anao" },
];

const SUPPORT_ITEMS = [
  { label: "FAQ do tutor", href: "/faq-do-tutor" },
  { label: "Política de privacidade", href: "/politica-de-privacidade" },
  { label: "Termos de uso", href: "/termos-de-uso" },
  { label: "Política editorial", href: "/politica-editorial" },
];

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const baseWhatsapp = buildWhatsAppLink({
    message: "Olá! Quero falar com a By Império Dog sobre disponibilidade de Spitz Alemão Anão.",
    utmSource: "site",
    utmMedium: "footer",
    utmCampaign: "footer_whatsapp",
    utmContent: "footer_cta",
  });
  const whatsapp = useWhatsAppLink(baseWhatsapp);

  return (
    <footer role="contentinfo">
      {/* ── Pre-footer CTA ──────────────────────────────────────────────────── */}
      <div className="bg-[var(--brand)] px-5 py-14 text-center sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Pronto para dar o próximo passo?</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Cada filhote tem uma família esperando por ele.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
          Conversa sem pressão. Apresento os disponíveis, respondo suas dúvidas e ajudo você a escolher com calma.
        </p>
        {/* O aria-label precisa começar pelo texto visível: por WCAG 2.5.3,
            quem navega por voz fala o que lê na tela. O antigo ("Conversar no
            WhatsApp") não continha "Conversar agora — sem compromisso" e
            quebrava o comando de voz. O "no WhatsApp" fica no fim porque o
            ícone é aria-hidden e nada mais diz para onde o link leva. */}
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-emerald-600 px-8 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Conversar agora — sem compromisso, no WhatsApp"
        >
          <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
          Conversar agora — sem compromisso
        </a>
      </div>

      {/* ── Footer body ─────────────────────────────────────────────────────── */}
      <div className="bg-zinc-900 text-zinc-400">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-5 sm:px-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href={routes.home} className="inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900">
              <span className="rounded-full bg-emerald-600/20 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-400">
                By Império Dog
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-zinc-400">
              Spitz Alemão Anão — criado com responsabilidade, acompanhamento veterinário e suporte da criadora depois da entrega.
            </p>
            <address className="not-italic space-y-1 text-sm">
              <p>
                <a href={`mailto:contato@byimperiodog.com.br`} className="transition hover:text-white">
                  contato@byimperiodog.com.br
                </a>
              </p>
              <p>
                <a href={whatsapp} target="_blank" rel="noreferrer" className="transition hover:text-white">
                  (11) 9 6863-3239
                </a>
              </p>
            </address>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <a
                href={GOOGLE_BUSINESS_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                Perfil no Google
              </a>
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                Avaliar no Google
              </a>
            </div>
          </div>

          {/* Navegação */}
          <nav aria-label="Navegação" className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Navegação</h3>
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-[48px] items-center py-1.5 text-sm transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Raça */}
          <nav aria-label="Sobre a raça" className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">A raça</h3>
            <ul className="space-y-1">
              {RACA_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-[48px] items-center py-1.5 text-sm transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Suporte */}
          <nav aria-label="Suporte" className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Suporte</h3>
            <ul className="space-y-1">
              {SUPPORT_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-[48px] items-center py-1.5 text-sm transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={openConsentPreferences}
                  className="inline-flex min-h-[48px] items-center py-1.5 text-left text-sm transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Preferências de cookies
                </button>
              </li>
            </ul>
          </nav>

          {/* Sobre */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Criação responsável</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              {["Registro oficial incluso", "Consulta veterinária e hemograma", "Mentoria pós-venda", `Criando desde ${FOUNDING_YEAR}`, "Bragança Paulista, SP"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-emerald-500" aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-zinc-800 py-4">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>&copy; {FOUNDING_YEAR}–{year ?? new Date().getFullYear()} By Império Dog. Todos os direitos reservados.</p>
            <p>Spitz Alemão Anão — acompanhamento veterinário e suporte direto com a criadora.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
