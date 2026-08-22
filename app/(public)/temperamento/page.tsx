import type { Metadata } from "next";

import { guides } from "@/content/guides";
import { buildArticleLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/temperamento`;

const guide = guides.find((g) => g.slug.includes("vs-lulu") || g.slug.includes("como-escolher")) ?? guides[0];

export const metadata: Metadata = {
  title: "Temperamento do Spitz Alemão Anão",
  description: guide.metaDescription,
  keywords: ["temperamento spitz alemão", "temperamento lulu da pomerania", "comportamento filhote"],
  // Esta pagina reaproveita integralmente o corpo do guia /guias/spitz-alemao-anao-vs-lulu-pomerania.
  // Conteudo identico em duas URLs: o canonical aponta para o guia original
  // (ja indexado e no sitemap) para nao competir consigo mesmo na busca.
  alternates: { canonical: "/guias/spitz-alemao-anao-vs-lulu-pomerania" },
  openGraph: { images: [OG_DEFAULT_IMAGE], title: "Temperamento — By Império Dog", description: guide.metaDescription },
};

const FAQS = guide.faqs ?? [];

export default function TemperamentoPage() {
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Guias", url: `${SITE_URL}/guias` },
    { name: "Temperamento", url: PAGE_URL },
  ]);
  const faqLd = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: guide.publishedAt });

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <script id="ld-temp-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-temp-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script id="ld-temp-business" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <script id="ld-temp-article" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Temperamento do Spitz Alemão Anão</h1>
        <p className="text-zinc-600">{guide.excerpt}</p>
      </header>

      <article className="mt-6 space-y-6">
        {guide.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-2xl font-semibold">{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className="mt-2 text-zinc-700">{p}</p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
