"use client";

import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "@/lib/whatsapp";

interface BlogCTAsProps {
  postTitle: string;
  category?: string | null;
}

const CTA_LINKS = [
  {
    title: "Filhotes sob consulta",
    description: "Visualize disponibilidade, cronograma de entrevistas e acompanhe a socializacao em tempo real.",
    href: "/filhotes",
    utmContent: "cta_filhotes",
  },
  {
    title: "Processo completo",
    description: "Conheca cada etapa: entrevista, socializacao guiada, entrega humanizada e mentoria vitalicia.",
    href: "/sobre#processo",
    utmContent: "cta_processo",
  },
  {
    title: "FAQ do tutor",
    description: "Transparencia sobre investimento, logistica, nutricao e convivencia com outras especies.",
    href: "/faq",
    utmContent: "cta_faq",
  },
];

export default function BlogCTAs({ postTitle, category }: BlogCTAsProps) {
  const categorySafe = (category || "").toLowerCase();

  const whatsappUrl = buildWhatsAppLink({
    message: WHATSAPP_MESSAGES.blog(postTitle),
    utmSource: "blog",
    utmMedium: "cta",
    utmCampaign: "blog_post",
    utmContent: "cta_whatsapp",
  });

  const highlightCards = CTA_LINKS.filter((item) => {
    if (!categorySafe) return true;
    if (categorySafe.includes("filhote")) return item.utmContent !== "cta_processo";
    if (categorySafe.includes("cuidado") || categorySafe.includes("saude")) return item.utmContent !== "cta_faq";
    if (categorySafe.includes("pergunta")) return item.utmContent !== "cta_faq";
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border bg-surface-subtle p-8 shadow-soft">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-soft">
            <MessageCircle className="h-8 w-8" aria-hidden />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-2xl font-serif text-text">
              Pronto para uma conversa sob consulta?
            </h3>
            <p className="text-sm text-text-muted">
              Atendimento humano, analise de perfil em ate 30 minutos e material exclusivo para planejar a chegada do Spitz.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-pill bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-soft transition hover:bg-brand-600 focus-ring min-h-[48px]"
            data-track-event="blog_whatsapp_cta"
          >
            <Phone className="h-5 w-5" aria-hidden />
            Conversar agora
          </a>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {highlightCards.map((item) => (
          <article
            key={item.href}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-soft transition hover:-translate-y-1"
          >
            <h4 className="text-lg font-semibold text-text">{item.title}</h4>
            <p className="text-sm text-text-muted">{item.description}</p>
            <Link
              href={`${item.href}?utm_source=blog&utm_medium=cta&utm_campaign=blog_post&utm_content=${item.utmContent}`}
              className="inline-flex items-center justify-center gap-2 rounded-pill border border-border px-5 py-2 text-sm font-semibold text-text transition hover:border-brand focus-ring"
            >
              Acessar agora
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </article>
        ))}

        <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-soft">
          <h4 className="text-lg font-semibold text-text">Newsletter para tutores premium</h4>
          <p className="text-sm text-text-muted">
            Receba insights trimestrais sobre nutricao, comportamento e investimentos para o primeiro ano.
          </p>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            action="https://byimperiodog.us21.list-manage.com/subscribe/post"
            method="POST"
          >
            <input type="hidden" name="utm_source" value="blog" />
            <input type="hidden" name="utm_medium" value="cta" />
            <input type="hidden" name="utm_campaign" value="blog_post" />
            <label htmlFor="newsletter-email-blog" className="sr-only">
              Seu melhor e-mail
            </label>
            <input
              id="newsletter-email-blog"
              name="EMAIL"
              type="email"
              required
              placeholder="Seu melhor e-mail"
              className="flex-1 rounded-pill border border-border bg-surface-subtle px-4 py-2 text-sm text-text focus:ring-2 focus:ring-brand/30"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-pill bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground shadow-soft hover:bg-brand-600 focus-ring"
            >
              Quero receber
            </button>
          </form>
          <p className="text-xs text-text-soft">
            Sem spam. Cancelamento com um clique.
          </p>
        </article>
      </div>
    </div>
  );
}
