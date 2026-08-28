import type { Metadata } from "next";

import { guides } from "@/content/guides";
import { buildArticleLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/cuidados`;

const guide = guides.find((g) => g.slug.includes("cuidados-basicos")) ?? guides[0];

export const metadata: Metadata = {
  title: "Cuidados com o Spitz Alemão Anão",
  description: guide.metaDescription,
  keywords: ["cuidados spitz alemão", "escovação lulu da pomerania", "banho spitz"],
  // Esta pagina reaproveita integralmente o corpo do guia /guias/cuidados-basicos-spitz-alemao-anao.
  // Conteudo identico em duas URLs: o canonical aponta para o guia original
  // (ja indexado e no sitemap) para nao competir consigo mesmo na busca.
  alternates: { canonical: "/guias/cuidados-basicos-spitz-alemao-anao" },
  openGraph: { images: [OG_DEFAULT_IMAGE], title: "Cuidados — By Império Dog", description: guide.metaDescription },
};

export default function CuidadosPage() {
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Guias", url: `${SITE_URL}/guias` },
    { name: "Cuidados", url: PAGE_URL },
  ]);
  const articleLd = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: guide.publishedAt });

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <script id="ld-cuidados-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-cuidados-article" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Cuidados Básicos com o Spitz Alemão</h1>
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
