"use client";

/**
 * WhatsAppFloat — Botão fixo de WhatsApp.
 *
 * • Visível nas páginas públicas, exceto /admin e /filhotes* (que já têm CTA próprio)
 * • Aparece após 3 s para não prejudicar CLS
 * • Mensagem automática personalizada conforme a rota atual
 * • Evento GA4/GTM disparado no clique ("wa_float_click")
 * • Some ao sobrepor elementos marcados com [data-wa-safe-zone]
 * • Respeita prefers-reduced-motion
 * • Touch target mínimo 48×48 px (WCAG 2.5.5)
 */

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import ReviewRequestPrompt from "@/components/ReviewRequestPrompt";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";

const WA_PHONE = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "5511968633239";

// Mensagem contextual por rota
function resolveMessage(pathname: string): string {
  if (pathname.startsWith("/filhotes/cor/creme"))
    return "Olá! Vi o Spitz Alemão Anão Creme no site da By Império Dog e gostaria de saber disponibilidade.";
  if (pathname.startsWith("/filhotes/cor/preto") || pathname.startsWith("/spitz-alemao-preto"))
    return "Olá! Vi o Spitz Alemão Anão Preto no site da By Império Dog e gostaria de saber disponibilidade.";
  if (pathname.startsWith("/filhotes/cor/laranja"))
    return "Olá! Vi o Spitz Alemão Anão Laranja no site da By Império Dog e gostaria de saber disponibilidade.";
  if (pathname.startsWith("/filhotes/sexo/femea"))
    return "Olá! Tenho interesse em uma fêmea de Spitz Alemão Anão. Pode me informar disponibilidade?";
  if (pathname.startsWith("/filhotes/sexo/macho"))
    return "Olá! Tenho interesse em um macho de Spitz Alemão Anão. Pode me informar disponibilidade?";
  if (pathname.startsWith("/filhotes/") && pathname !== "/filhotes")
    return "Olá! Vi um filhote no catálogo da By Império Dog e gostaria de mais informações.";
  if (pathname === "/filhotes")
    return "Olá! Estou vendo o catálogo da By Império Dog e gostaria de saber disponibilidade de filhotes.";
  if (pathname.startsWith("/preco-spitz-anao"))
    return "Olá! Vi a tabela de preços no site da By Império Dog e gostaria de saber disponibilidade.";
  if (pathname.startsWith("/comprar-spitz-anao"))
    return "Olá! Estou interessado em comprar um Spitz Alemão Anão da By Império Dog. Pode me ajudar?";
  if (pathname.startsWith("/criador-spitz-confiavel"))
    return "Olá! Vi o perfil da By Império Dog e gostaria de conhecer melhor o canil e os filhotes.";
  if (pathname.startsWith("/spitz-alemao-baby-face"))
    return "Olá! Vi sobre o Spitz Alemão Baby Face no site da By Império Dog. Pode me passar mais informações?";
  if (pathname.startsWith("/blog"))
    return "Olá! Li um artigo no blog da By Império Dog e gostaria de saber mais sobre os filhotes.";
  // default
  return "Olá! Vim pelo site da By Império Dog e gostaria de informações sobre o Spitz Alemão Anão.";
}

function fireEvent(eventName: string, params: Record<string, string>) {
  try {
    // GA4 / GTM dataLayer
    const w = window as any;
    if (typeof w.gtag === "function") {
      w.gtag("event", eventName, params);
    }
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: eventName, ...params });
    }
    // Meta Pixel
    if (typeof w.fbq === "function") {
      w.fbq("trackCustom", eventName, params);
    }
  } catch {
    // silently ignore
  }
}

// Páginas de /filhotes já têm CTA de WhatsApp dedicado por card/detalhe
// (StaticPuppyCard "Tenho interesse", PuppyStickyFloatingCTA no mobile) —
// o botão flutuante global aqui colidiria visualmente com eles.
function hasOwnWhatsAppCta(pathname: string): boolean {
  return pathname.startsWith("/filhotes");
}

export function WhatsAppFloat() {
  const pathname = usePathname() ?? "/";
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [overlapping, setOverlapping] = useState(false);
  const firstPulse = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafPending = useRef(false);
  const whatsappUrl = useWhatsAppLink(
    `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(resolveMessage(pathname))}`,
  );

  // Aparece após 3 s — não perturba CLS / LCP
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Esconde durante o scroll ativo para não cobrir texto/botões — reaparece ~500ms após parar
  useEffect(() => {
    const onScroll = () => {
      setScrolling(true);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => setScrolling(false), 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  // Some se o botão for sobrepor um elemento marcado como zona segura
  // (ex.: grid de benefícios da home) — evita cobrir texto/CTAs abaixo dele.
  useEffect(() => {
    const BUTTON_SIZE = 56;
    const MARGIN = 20;
    const BUFFER = 12;

    const checkOverlap = () => {
      rafPending.current = false;
      const zones = document.querySelectorAll("[data-wa-safe-zone]");
      if (zones.length === 0) {
        setOverlapping(false);
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const btn = {
        left: vw - MARGIN - BUTTON_SIZE - BUFFER,
        right: vw,
        top: vh - MARGIN - BUTTON_SIZE - BUFFER,
        bottom: vh,
      };
      let hit = false;
      zones.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > btn.left && r.left < btn.right && r.bottom > btn.top && r.top < btn.bottom) {
          hit = true;
        }
      });
      setOverlapping(hit);
    };

    const onScrollOrResize = () => {
      if (rafPending.current) return;
      rafPending.current = true;
      requestAnimationFrame(checkOverlap);
    };

    checkOverlap();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [pathname]);

  // Pulsa suavemente uma vez após 8 s para chamar atenção
  useEffect(() => {
    if (!visible || firstPulse.current) return;
    const t = setTimeout(() => {
      firstPulse.current = true;
      setPulse(true);
      setTimeout(() => setPulse(false), 1500);
    }, 8000);
    return () => clearTimeout(t);
  }, [visible]);

  const handleClick = useCallback(() => {
    // Evento legado (compatibilidade com dashboards existentes)
    fireEvent("wa_float_click", { page_path: pathname, wa_phone: WA_PHONE });
    // Evento padrão de conversão GA4
    fireEvent("lead_whatsapp", { page_path: pathname, source: "float_button" });
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    // Solicita review 5s após o clique — growth loop: visita → WhatsApp → review → mais visibilidade
    setTimeout(() => setShowReview(true), 5000);
  }, [pathname, whatsappUrl]);

  if (!visible || hasOwnWhatsAppCta(pathname)) return null;

  const hidden = scrolling || overlapping;

  return (
    <>
    {showReview && <ReviewRequestPrompt trigger="whatsapp" />}
    <button
      type="button"
      onClick={handleClick}
      aria-label="Falar no WhatsApp com a criadora"
      className={[
        // Position — bottom-safe usa env(safe-area-inset-bottom) para Dynamic Island / home bar do iOS
        "fixed bottom-safe right-5 z-[9998]",
        // Size — 56×56 (WCAG touch target)
        "flex h-14 w-14 items-center justify-center rounded-full",
        // Colour
        "bg-[#25D366] text-white shadow-xl",
        // Hover (apenas em dispositivos que fazem hover de verdade)
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40",
        // Desktop hover
        "hover:scale-110 hover:brightness-105",
        // Press feedback universal (touch + mouse)
        "active:scale-95 active:brightness-95",
        // Pulse animation
        pulse ? "animate-wa-pulse" : "",
        // Some durante o scroll ativo ou ao sobrepor uma zona segura — respeita prefers-reduced-motion (some sem transição)
        hidden
          ? "opacity-0 pointer-events-none translate-y-2 motion-reduce:transition-none"
          : "opacity-100 pointer-events-auto translate-y-0",
      ].filter(Boolean).join(" ")}
    >
      {/* WhatsApp SVG (inline para zero‐dependency, optimised path) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width={28}
        height={28}
        aria-hidden="true"
      >
        <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.85.503 3.58 1.376 5.063L2 22l5.09-1.356A9.94 9.94 0 0 0 12.001 22C17.523 22 22 17.522 22 12S17.523 2 12.001 2Zm0 18.182a8.156 8.156 0 0 1-4.165-1.14l-.298-.178-3.02.804.817-2.96-.194-.305A8.167 8.167 0 0 1 3.82 12c0-4.51 3.67-8.182 8.182-8.182C16.512 3.818 20.182 7.49 20.182 12S16.512 20.182 12 20.182Zm4.49-6.12c-.247-.123-1.456-.72-1.682-.8-.226-.083-.39-.123-.556.122-.165.247-.638.8-.782.966-.144.164-.288.184-.534.06-.248-.123-1.046-.386-1.993-1.228-.737-.655-1.236-1.466-1.38-1.713-.145-.247-.016-.38.108-.503.11-.11.247-.288.37-.431.124-.144.165-.247.248-.412.082-.165.041-.309-.02-.432-.062-.123-.557-1.34-.762-1.836-.2-.48-.404-.415-.556-.423l-.474-.008c-.165 0-.432.062-.659.309-.226.247-.864.845-.864 2.061s.885 2.39 1.007 2.555c.124.165 1.745 2.664 4.228 3.734.59.255 1.05.407 1.41.521.592.19 1.131.163 1.557.1.475-.07 1.457-.596 1.663-1.17.206-.576.206-1.07.144-1.17-.06-.103-.224-.165-.473-.288Z" />
      </svg>
    </button>
    </>
  );
}

export default WhatsAppFloat;
