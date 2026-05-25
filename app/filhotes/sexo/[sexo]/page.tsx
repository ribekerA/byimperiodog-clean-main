import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { staticPuppies } from "@/content/puppies-static";
import { ALL_SEXES, formatPrice, getPuppiesBySex, SEX_SEO } from "@/lib/catalog-utils";
import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Props = { params: { sexo: string } };

export function generateStaticParams() {
  return ALL_SEXES.map((sexo) => ({ sexo }));
}

export function generateMetadata({ params }: Props): Metadata {
  const seo = SEX_SEO[params.sexo];
  if (!seo) return { title: "Filhotes por Sexo | By Império Dog" };
  return {
    title: seo.seoTitle,
    description: seo.metaDescription,
    alternates: { canonical: `/filhotes/sexo/${params.sexo}` },
    openGraph: { title: seo.seoTitle, description: seo.metaDescription, type: "website" },
  };
}

const STATUS_CONFIG = {
  available: { label: "Disponível", className: "bg-emerald-100 text-emerald-800" },
  reserved: { label: "Reservado", className: "bg-amber-100 text-amber-800" },
  sold: { label: "Vendido", className: "bg-zinc-100 text-zinc-600" },
} as const;

export default function SexLandingPage({ params }: Props) {
  const seo = SEX_SEO[params.sexo];
  if (!seo) notFound();

  const puppies = getPuppiesBySex(params.sexo);
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.byimperiodog.com.br").replace(/\/$/, "");

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Filhotes", url: `${SITE_URL}/filhotes` },
    { name: seo.h1, url: `${SITE_URL}/filhotes/sexo/${params.sexo}` },
  ]);
  const faqLd = buildFAQLD(seo.faqs);
  const businessLd = buildLocalBusinessLD();

  const waLink = buildWhatsAppLink({
    message: `Olá! Tenho interesse em ${seo.h1} Spitz Alemão Anão (Lulu da Pomerânia). Pode me informar disponibilidade e valores?`,
    utmSource: "site",
    utmMedium: "sex_page",
    utmCampaign: "filhote_sexo",
    utmContent: params.sexo,
  });

  const otherSex = ALL_SEXES.find((s) => s !== params.sexo);

  return (
    <>
      <Script id="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Script id="ld-business" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
        {/* Breadcrumb */}
        <nav aria-label="Navegação estrutural" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
            <li><Link href="/" className="hover:text-emerald-700 hover:underline">Início</Link></li>
            <li aria-hidden="true" className="text-zinc-300">/</li>
            <li><Link href="/filhotes" className="hover:text-emerald-700 hover:underline">Filhotes</Link></li>
            <li aria-hidden="true" className="text-zinc-300">/</li>
            <li className="font-medium text-zinc-900" aria-current="page">{seo.h1}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">{seo.h1}</h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600">{seo.intro}</p>

          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex min-h-[52px] items-center gap-2.5 rounded-xl bg-emerald-600 px-6 text-base font-semibold text-white shadow-lg transition hover:bg-emerald-700"
          >
            <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
            Ver disponibilidade — WhatsApp
          </a>
        </header>

        {/* Characteristics */}
        <section className="mt-12" aria-labelledby="char-heading">
          <h2 id="char-heading" className="mb-4 text-lg font-bold text-zinc-900">Por que {seo.h1}?</h2>
          <ul className="space-y-2">
            {seo.characteristics.map((c) => (
              <li key={c} className="flex items-start gap-2 text-zinc-700">
                <span className="mt-1 text-emerald-600" aria-hidden="true">✓</span>
                {c}
              </li>
            ))}
          </ul>
        </section>

        {/* Puppies grid */}
        <section className="mt-14" aria-labelledby="puppies-heading">
          <h2 id="puppies-heading" className="mb-6 text-2xl font-bold text-zinc-900">
            {puppies.length > 0 ? `${seo.h1} disponíveis (${puppies.length})` : "Lista de interesse"}
          </h2>

          {puppies.length > 0 ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {puppies.map((puppy) => {
                const sexLabel = puppy.sex === "female" ? "Fêmea" : "Macho";
                const corLabel = (puppy as any).cor ?? puppy.color ?? "";
                const img = puppy.images?.find((i: string) => !i.endsWith(".mp4"));
                const status = (puppy.status ?? "available") as keyof typeof STATUS_CONFIG;
                return (
                  <li key={puppy.slug}>
                    <Link
                      href={`/filhotes/${puppy.slug}`}
                      className="group block overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                        {img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt={`Filhote ${puppy.name}`}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CONFIG[status]?.className ?? ""}`}>
                            {STATUS_CONFIG[status]?.label ?? ""}
                          </span>
                          <span className="text-xs text-zinc-500">{corLabel}</span>
                        </div>
                        <p className="font-semibold text-zinc-900">{puppy.name}</p>
                        <p className="mt-0.5 text-sm text-zinc-500">{sexLabel}</p>
                        {(puppy as any).priceCents > 0 && (
                          <p className="mt-1 text-sm font-bold text-emerald-700">{formatPrice((puppy as any).priceCents)}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 text-center">
              <p className="text-zinc-700">No momento não há {seo.h1} disponíveis.</p>
              <p className="mt-2 text-sm text-zinc-500">Entre em contato e seja avisado quando houver disponibilidade.</p>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                Entrar na lista de interesse
              </a>
            </div>
          )}
        </section>

        {/* FAQ */}
        <section className="mt-20" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="mb-6 text-2xl font-bold text-zinc-900">Perguntas frequentes</h2>
          <dl className="space-y-4">
            {seo.faqs.map((faq) => (
              <div key={faq.question} className="rounded-xl border border-zinc-100 bg-white p-6">
                <dt className="font-semibold text-zinc-900">{faq.question}</dt>
                <dd className="mt-2 text-zinc-600 leading-relaxed">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Other sex */}
        {otherSex && (
          <section className="mt-12" aria-labelledby="other-sex-heading">
            <h2 id="other-sex-heading" className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Também disponível
            </h2>
            <Link
              href={`/filhotes/sexo/${otherSex}`}
              className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700"
            >
              {SEX_SEO[otherSex]?.h1 ?? otherSex}
            </Link>
          </section>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/filhotes"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-emerald-700 hover:underline"
          >
            ← Ver todos os filhotes
          </Link>
        </div>
      </main>
    </>
  );
}
