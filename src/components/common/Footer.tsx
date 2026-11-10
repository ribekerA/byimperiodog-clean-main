"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  FOUNDING_YEAR,
  GOOGLE_MAPS_PROFILE_URL,
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
  { label: "Spitz Alemão Anão (Lulu da Pomerânia)", href: "/spitz-alemao" },
  { label: "Lulu da Pomerânia", href: "/lulu-da-pomerania" },
  { label: "Pomeranian", href: "/pomeranian" },
  { label: "Filhote de Spitz", href: "/filhote-de-spitz-alemao" },
  { label: "Spitz Alemão (Lulu da Pomerânia) Branco", href: "/spitz-alemao-branco" },
  { label: "Spitz Alemão (Lulu da Pomerânia) Preto", href: "/spitz-alemao-preto" },
  { label: "Spitz Alemão (Lulu da Pomerânia) Baby Face", href: "/spitz-alemao-baby-face" },
  { label: "Ninhadas", href: "/ninhadas" },
  { label: "Como Comprar", href: "/comprar-spitz-anao" },
  { label: "Entrega em todo o Brasil", href: "/blog/spitz-alemao-anao-entrega-brasil" },
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
    message: "Olá! Quero falar com a By Império Dog sobre disponibilidade de Spitz Alemão Anão (Lulu da Pomerânia).",
    utmSource: "site",
    utmMedium: "footer",
    utmCampaign: "footer_whatsapp",
    utmContent: "footer_cta",
  });
  const whatsapp = useWhatsAppLink(baseWhatsapp);

  return (
    <footer role="contentinfo" className="rp">
      {/* ── Chamada antes do rodapé ─────────────────────────────────────────── */}
      <div className="rp-chamada">
        <p className="rp-sobretitulo">Pronto para dar o próximo passo?</p>
        <h2 className="rp-titulo">Cada filhote tem uma família esperando por ele.</h2>
        <svg className="vf-traco" viewBox="0 0 165 14" fill="none" aria-hidden="true">
          <path d="M1 12C45 3 110 1 164 2C110 4 55 7 1 12Z" fill="#d6a748" />
        </svg>
        <p className="rp-convite">
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
          className="rp-cta"
          aria-label="Conversar agora — sem compromisso, no WhatsApp"
        >
          <WhatsAppIcon aria-hidden="true" />
          Conversar agora — sem compromisso
        </a>
      </div>

      {/* ── Corpo do rodapé ─────────────────────────────────────────────────── */}
      <div className="rp-corpo">
        <div className="rp-marca">
          <Link href={routes.home} className="rp-logo">
            <Image src="/images/home/coroa.webp" alt="" width={230} height={148} unoptimized loading="lazy" />
            <span>
              <span className="rp-logo-nome">By Império Dog<sup>®</sup></span>{" "}
              <span className="rp-logo-lema">Sementinhas de Amor</span>
            </span>
          </Link>
          <p>
            Spitz Alemão Anão (Lulu da Pomerânia) — atendimento especializado, acompanhamento veterinário e suporte da criadora depois da entrega.
          </p>
          <address>
            <a href={`mailto:contato@byimperiodog.com.br`}>contato@byimperiodog.com.br</a>
            <a href={whatsapp} target="_blank" rel="noreferrer">(11) 9 6863-3239</a>
          </address>
          <div className="rp-google">
            <a href={GOOGLE_MAPS_PROFILE_URL} target="_blank" rel="noopener noreferrer">Perfil no Google</a>
            <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">Avaliar no Google</a>
          </div>
        </div>

        <nav aria-label="Navegação" className="rp-coluna">
          <h3>Navegação</h3>
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Suporte" className="rp-coluna">
          <h3>Suporte</h3>
          <ul>
            {SUPPORT_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <button type="button" onClick={openConsentPreferences}>
                Preferências de cookies
              </button>
            </li>
          </ul>
        </nav>

        <nav aria-label="Sobre a raça" className="rp-coluna rp-coluna-raca">
          <h3>A raça</h3>
          <ul>
            {RACA_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="rp-coluna rp-coluna-criacao">
          <h3>Nosso compromisso</h3>
          <ul className="rp-selos">
            {["Registro oficial incluso", "Consulta veterinária e hemograma", "Mentoria pós-venda", `Especialistas desde ${FOUNDING_YEAR}`, "Bragança Paulista, SP"].map((item) => (
              <li key={item}>
                <span aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Linha final */}
      <div className="rp-final">
        <div>
          <p>&copy; {FOUNDING_YEAR}–{year ?? new Date().getFullYear()} By Império Dog. Todos os direitos reservados.</p>
          <p>Spitz Alemão Anão (Lulu da Pomerânia) — acompanhamento veterinário e suporte direto com a criadora.</p>
        </div>
      </div>
    </footer>
  );
}
