import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import BlogPuppyBanner from "@/components/blog/BlogPuppyBanner";
import { guides, getGuideBySlug } from "@/content/guides";
import { buildArticleLD, buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const guide = getGuideBySlug(params.slug);
  if (!guide) return { title: "Guia não encontrado | By Império Dog" };
  return {
    title: `${guide.title} | By Império Dog`,
    description: guide.metaDescription,
    alternates: { canonical: `/guias/${guide.slug}` },
    openGraph: { title: guide.title, description: guide.metaDescription, type: "article" },
  };
}

export default function GuidePage({ params }: Props) {
  const guide = getGuideBySlug(params.slug);
  if (!guide) notFound();

  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");

  const articleLd = buildArticleLD({
    title: guide.title,
    description: guide.metaDescription,
    url: `/guias/${guide.slug}`,
    publishedAt: guide.publishedAt,
    updatedAt: guide.updatedAt,
  });
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Guias", url: `${SITE_URL}/guias` },
    { name: guide.title, url: `${SITE_URL}/guias/${guide.slug}` },
  ]);
  const faqLd = buildFAQLD(guide.faqs);
  const businessLd = buildLocalBusinessLD();

  const waLink = buildWhatsAppLink({
    message: `Olá! Li o guia "${guide.title}" e quero saber mais sobre filhotes disponíveis.`,
    utmSource: "site",
    utmMedium: "guide_page",
    utmCampaign: "guia_leitura",
    utmContent: guide.slug,
  });

  const otherGuides = guides.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <>
      <Script id="ld-article" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <Script id="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-business" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Navegação estrutural" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
            <li><Link href="/" className="hover:text-emerald-700 hover:underline">Início</Link></li>
            <li aria-hidden="true" className="text-zinc-300">/</li>
            <li><Link href="/guias" className="hover:text-emerald-700 hover:underline">Guias</Link></li>
            <li aria-hidden="true" className="text-zinc-300">/</li>
            <li className="font-medium text-zinc-900 line-clamp-1" aria-current="page">{guide.title}</li>
          </ol>
        </nav>

        {/* Article header */}
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl leading-tight">
            {guide.title}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 leading-relaxed">{guide.excerpt}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
            <time dateTime={guide.updatedAt ?? guide.publishedAt}>
              Atualizado em{" "}
              {new Date(guide.updatedAt ?? guide.publishedAt).toLocaleDateString("pt-BR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span aria-hidden="true">·</span>
            <span>{guide.readingMinutes} min de leitura</span>
            <span aria-hidden="true">·</span>
            <span>By Império Dog</span>
          </div>
        </header>

        {/* Article body */}
        <article className="prose prose-zinc prose-lg max-w-none prose-headings:font-bold prose-a:text-emerald-700 prose-a:no-underline hover:prose-a:underline">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
        </article>

        <BlogPuppyBanner postTitle={guide.title} />

        {/* FAQ */}
        {guide.faqs.length > 0 && (
          <section className="mt-16" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes</h2>
            <dl className="space-y-4">
              {guide.faqs.map((faq) => (
                <div key={faq.question} className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
                  <dt className="font-semibold text-zinc-900">{faq.question}</dt>
                  <dd className="mt-2 text-zinc-600 leading-relaxed">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* CTA */}
        <div className="mt-14 overflow-hidden rounded-2xl bg-[var(--brand)] px-8 py-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Pronto para o próximo passo?</p>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Encontre seu filhote ideal</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
            Converse com a criadora e descubra qual filhote combina com você e sua família.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[52px] items-center gap-2.5 rounded-xl bg-emerald-600 px-7 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-500"
            >
              <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
              Falar com a criadora
            </a>
            <Link
              href="/filhotes"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-2 border-white/20 px-7 text-base font-semibold text-white transition hover:border-white/60"
            >
              Ver filhotes →
            </Link>
          </div>
        </div>

        {/* Other guides */}
        {otherGuides.length > 0 && (
          <section className="mt-16" aria-labelledby="other-guides-heading">
            <h2 id="other-guides-heading" className="mb-5 text-xl font-bold text-zinc-900">Continue lendo</h2>
            <ul className="space-y-3">
              {otherGuides.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guias/${g.slug}`}
                    className="group flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm"
                  >
                    <span className="font-medium text-zinc-800 group-hover:text-emerald-700 transition">{g.title}</span>
                    <span className="ml-4 flex-shrink-0 text-xs text-zinc-400">{g.readingMinutes} min</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/guias"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-emerald-700 hover:underline"
          >
            ← Todos os guias
          </Link>
        </div>
      </div>
    </>
  );
}
