"use client";
import { Instagram, Youtube, MessageCircle, Rocket, Facebook } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { trackWhatsAppClick, trackNewsletterSubscribe } from "@/lib/events";
import { routes, type AppRoutes } from "@/lib/route";
import { WHATSAPP_LINK } from "@/lib/whatsapp";

// Ícone TikTok custom leve (monocromático neutro para herdar cor)
function TikTokIcon({ size = 18, className, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M30.9 7.2c1.2 2.2 3.3 3.9 5.8 4.3v5.2c-2.2-.05-4.3-.65-6.2-1.7v11.3c0 6.6-4.5 11.2-11.3 11.2A11.2 11.2 0 0 1 8 26.4c0-6.4 4.8-10.9 11.7-11.1v5.6c-3.7.3-5.7 2-5.7 5.3 0 3.2 2 5.2 5 5.2 3.3 0 5.2-2 5.2-5.6V7h6.7l.1.2Z" />
    </svg>
  );
}

// Número oficial atualizado via helper centralizado
const WA = WHATSAPP_LINK;

const year = new Date().getFullYear();

const menuLinks: { label: string; path: AppRoutes }[] = [
  { label: "Home", path: routes.home },
  { label: "Sobre", path: routes.sobre },
  { label: "Filhotes", path: routes.filhotes },
  { label: "Blog", path: routes.blog },
  { label: "Contato", path: routes.contato },
];

export default function FooterFixed() {
  const [showTop, setShowTop] = useState(false);

  // Throttle via rAF (INP friendly)
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setShowTop(window.scrollY > 400);
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Respeita prefers-reduced-motion sem depender de libs
  const scrollTop = useCallback(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  }, []);

  const rootClasses = "relative text-sm border-t bg-zinc-900 text-zinc-200 border-zinc-700";

  return (
    <footer className={rootClasses} data-site-shell="footer">
      {/* Divisor topo simples */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

      {/* CTA Section */}
      <section
        aria-labelledby="cta-filhotes"
        className="relative isolate px-6 py-12 sm:py-14 text-center text-white"
      >
        <div className="mx-auto max-w-3xl">
          <h2 id="cta-filhotes" className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight">
            Pronto para garantir seu Spitz Alemão?
          </h2>
          <p className="mt-3 text-zinc-300 text-sm sm:text-base leading-relaxed">
            Atendimento humano, suporte pós-venda e acompanhamento responsável.
          </p>
          <a
            href={WA}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fale conosco no WhatsApp"
            onClick={() => trackWhatsAppClick('footer-cta', 'CTA Principal Footer')}
            className="inline-flex mt-6 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-zinc-900 shadow-lg hover:shadow-xl transition-all min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            <span>Falar no WhatsApp</span>
            <WAIcon size={18} aria-hidden="true" />
          </a>
        </div>
      </section>

      <nav
        aria-label="Links do rodapé"
        className="relative max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 py-12"
      >
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-white tracking-tight">
            Menu
          </h3>
          <ul className="space-y-2">
            {menuLinks.map(({ label, path }) => (
              <li key={path}>
                <Link
                  href={path}
                  className="inline-flex items-center gap-1 rounded px-1 py-1 text-zinc-300 hover:text-white transition min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-semibold text-white tracking-tight">
            Redes Sociais
          </h3>
          <ul className="space-y-2">
            {[ 
              { label: "Instagram", Icon: Instagram, href: "https://instagram.com/byimperiodog" },
              { label: "Facebook", Icon: Facebook, href: "https://facebook.com/byimperiodog" },
              { label: "YouTube", Icon: Youtube, href: "https://youtube.com/@byimperiodog" },
              { label: "TikTok", Icon: TikTokIcon, href: "https://www.tiktok.com/@byimperiodogs" },
              { label: "Fale Conosco", Icon: MessageCircle, href: routes.contato },
            ].map(({ label, Icon, href }) => {
              const isInternal = href.startsWith('/');
              const classes = "flex items-center gap-2 rounded px-1 py-1 text-zinc-300 hover:text-white transition min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900";
              const content = <>
                {Icon ? <Icon size={18} aria-hidden="true" /> : null}
                {label}
              </>;
              return (
                <li key={label}>
                  {isInternal ? (
                    <Link href={href as AppRoutes} className={classes} aria-label={label}>{content}</Link>
                  ) : (
                    <a href={href} target="_blank" rel="noopener noreferrer" className={classes} aria-label={label}>{content}</a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <div className="h-full rounded-xl border border-zinc-700 bg-zinc-800 p-5 flex flex-col shadow-sm">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Assine nossa newsletter
            </h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">Receba novidades, dicas de cuidados e novos filhotes.</p>
            <div className="mt-4">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </nav>

      <div className="relative mt-4 border-t border-zinc-700 py-6 text-xs text-zinc-400">
        <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <p className="font-medium text-zinc-300">&copy; {year} By Imperio Dog</p>
          <nav aria-label="Links institucionais" className="flex flex-wrap items-center gap-4 text-xs">
            <Link href={routes.sobre} className="hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded px-1">Sobre</Link>
            <Link href={routes.contato} className="hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded px-1">Contato</Link>
            <Link href={routes.politica} className="hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded px-1">Privacidade</Link>
          </nav>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollTop}
        aria-label="Voltar ao topo"
        className={`fixed right-4 bottom-32 min-h-[48px] min-w-[48px] bg-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-emerald-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 motion-reduce:transform-none ${showTop ? 'opacity-100' : 'opacity-0 pointer-events-none'} mb-[env(safe-area-inset-bottom)] z-50 flex items-center justify-center`}
      >
        <Rocket size={20} aria-hidden="true" />
      </button>

      <a
        href={WA}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsAppClick('footer-floating', 'Botão Flutuante WhatsApp')}
        className="fixed right-4 bottom-6 min-h-[56px] min-w-[56px] bg-whatsapp text-white rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 motion-reduce:transform-none mb-[env(safe-area-inset-bottom)] z-50"
        aria-label="Conversar no WhatsApp"
      >
        <WAIcon size={24} />
      </a>
    </footer>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
  setMsg({ type: "error", text: "E-mail inválido" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
  setMsg({ type: "success", text: data?.message || "Inscrição realizada com sucesso!" });
        setEmail("");
        trackNewsletterSubscribe('footer-newsletter');
      } else {
  setMsg({ type: "error", text: data?.message || "Não foi possível inscrever agora." });
      }
    } catch {
      setMsg({ type: "error", text: "Erro de rede. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
  <form className="flex flex-col sm:flex-row gap-3" aria-label="Formulário de inscrição" onSubmit={onSubmit} noValidate>
      <div className="relative flex-1">
        <label className="sr-only" htmlFor="newsletter-email">E-mail</label>
        <input
          id="newsletter-email"
          type="email"
          placeholder="Seu melhor e-mail"
          aria-describedby="newsletter-msg"
          className="peer w-full px-4 py-2 rounded-md bg-white text-zinc-900 placeholder:text-zinc-400 border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand shadow-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          autoComplete="email"
          inputMode="email"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="relative inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500/90 active:scale-[.98] motion-reduce:transform-none transition px-5 py-2 rounded-md font-semibold text-white shadow disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50"
      >
        {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/50 border-t-white" aria-hidden="true" />}
        {loading ? "Enviando..." : "Inscrever"}
      </button>
      {msg && (
        <p
          id="newsletter-msg"
          aria-live="polite"
          role={msg.type === 'error' ? 'alert' : 'status'}
          className={
            "sm:col-span-2 text-xs mt-1 " +
            (msg.type === 'success' ? 'text-emerald-200' : msg.type === 'error' ? 'text-red-200' : 'text-white/80')
          }
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}

