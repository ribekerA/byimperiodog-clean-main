// Server component de proposito. Blocos de CTA e um form com action HTML. Nenhum handler React — o envio e submit nativo. Sai do bundle junto com os icones que importa.

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
    description: "Visualize disponibilidade, cronograma de entrevistas e acompanhe a socialização em tempo real.",
    href: "/filhotes",
    utmContent: "cta_filhotes",
  },
  {
    title: "Processo completo",
    description: "Conheça cada etapa: contato, documentação, reserva em contrato, entrega e acompanhamento pós-venda.",
    href: "/sobre#processo",
    utmContent: "cta_processo",
  },
  {
    title: "FAQ do tutor",
    description: "Transparência sobre investimento, logística, nutrição e convivência com outras espécies.",
    href: "/faq-do-tutor",
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
      {/* Newsletter — full-width, topo da seção */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-emerald-50 to-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand">Newsletter · Tutores premium</p>
            <h3 className="text-xl font-serif text-text">Receba o guia exclusivo do 1.º ano do Spitz</h3>
            <p className="text-sm text-text-muted">
              Nutrição, comportamento, rotinas e saúde — direto no seu e-mail. Sem spam.
            </p>
          </div>
          <form
            className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[300px] sm:flex-row"
            action="https://byimperiodog.us21.list-manage.com/subscribe/post"
            method="POST"
          >
            <input type="hidden" name="utm_source" value="blog" />
            <input type="hidden" name="utm_medium" value="newsletter_cta" />
            <input type="hidden" name="utm_campaign" value="blog_post" />
            <label htmlFor="newsletter-email-blog" className="sr-only">Seu melhor e-mail</label>
            <input
              id="newsletter-email-blog"
              name="EMAIL"
              type="email"
              required
              placeholder="Seu melhor e-mail"
              className="flex-1 rounded-pill border border-border bg-white px-4 py-2.5 text-sm text-text shadow-sm focus:ring-2 focus:ring-brand/30 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand shadow-soft transition hover:brightness-110 focus-ring whitespace-nowrap"
            >
              Quero receber
            </button>
          </form>
        </div>
      </div>

      {/* WhatsApp CTA principal */}
      <div className="rounded-3xl border border-border bg-surface-subtle p-8 shadow-soft">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand shadow-soft">
            <MessageCircle className="h-8 w-8" aria-hidden />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-2xl font-serif text-text">
              Pronto para uma conversa sob consulta?
            </h3>
            <p className="text-sm text-text-muted">
              Atendimento humano, todos os dias das 8h às 22h, para tirar dúvidas sobre as opções atuais.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-pill bg-brand px-6 py-3 text-sm font-semibold text-on-brand shadow-soft transition hover:brightness-110 focus-ring min-h-[48px]"
            data-track-event="blog_whatsapp_cta"
          >
            <Phone className="h-5 w-5" aria-hidden />
            Conversar agora
          </a>
        </div>
      </div>

      {/* Content cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {highlightCards.map((item) => (
          <article
            key={item.href}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 shadow-soft transition hover:-translate-y-1"
          >
            <h4 className="text-lg font-semibold text-text">{item.title}</h4>
            <p className="text-sm text-text-muted">{item.description}</p>
            <Link
              href={`${item.href}?utm_source=blog&utm_medium=cta&utm_campaign=blog_post&utm_content=${item.utmContent}`}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-pill border border-border px-5 py-2 text-sm font-semibold text-text transition hover:border-brand focus-ring"
            >
              Acessar agora
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
