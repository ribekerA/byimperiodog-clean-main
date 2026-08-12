import type { Metadata } from "next";
import Link from "next/link";

import { RelatedPages } from "@/components/common/RelatedPages";
import { staticPuppies } from "@/content/puppies-static";
import { buildArticleLD } from "@/lib/schema";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD, buildFAQLD, buildLocalBusinessLD } from "@/lib/structured-data";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");
const PAGE_URL = `${SITE_URL}/ninhadas`;

export const metadata: Metadata = {
  title: "Ninhadas — Agenda de Filhotes e Próximas Ninhadas",
  description: "Agenda de ninhadas planejadas, próximas ninhadas e filhotes reserváveis. Veja quais cores e datas previstas e entre na lista de interesse.",
  keywords: ["ninhadas", "próximas ninhadas", "filhotes spitz alemão", "lulu da pomerania ninhadas"],
  alternates: { canonical: "/ninhadas" },
  openGraph: { images: [OG_DEFAULT_IMAGE], title: "Ninhadas — By Império Dog", description: "Agenda e disponibilidade de ninhadas de Spitz Alemão Anão (Lulu da Pomerânia)." },
};

const FAQS = [
  { question: "Como funcionam as reservas de ninhadas?", answer: "Reservas são por ordem de interesse e mediante pagamento de sinal. A criadora entrará em contato para confirmar datas e condições." },
  { question: "Posso entrar em lista de espera?", answer: "Sim — colocamos interessados em lista e avisamos quando houver confirmação de cobertura e nascimento." },
];

export default function NinhadasPage() {
  const puppies = staticPuppies.filter((p) => p.status === "planned" || p.status === "pregnant" || p.status === "born");

  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início", url: `${SITE_URL}/` },
    { name: "Filhotes", url: `${SITE_URL}/filhotes` },
    { name: "Ninhadas", url: PAGE_URL },
  ]);
  const faqLd = buildFAQLD(FAQS);
  const businessLd = buildLocalBusinessLD();
  const articleLd = buildArticleLD({ url: PAGE_URL, title: metadata.title as string, description: metadata.description as string, datePublished: new Date().toISOString() });

  return (
    <main className="mx-auto max-w-4xl px-5 py-14">
      <script id="ld-ninhadas-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-ninhadas-faq" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script id="ld-ninhadas-business" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <script id="ld-ninhadas-article" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="space-y-4">
        <h1 className="text-3xl font-bold">Ninhadas e Agenda de Filhotes</h1>
        <p className="text-zinc-600">Acompanhe as próximas ninhadas, cores previstas e disponibilidade. Entre na lista de interesse para receber aviso por WhatsApp.</p>
      </header>

      <section className="mt-8 space-y-6">
        {puppies.length === 0 ? (
          <p className="text-zinc-600">Nenhuma ninhada agendada no momento. Entre em contato para ser incluído na lista de interesse.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {puppies.map((p) => (
              <li key={p.slug} className="rounded-lg border p-4">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-zinc-600">Cidade: {p.city} — Nascimento previsto: {p.birth_date ?? 'A confirmar'}</p>
                <p className="mt-2 text-sm text-zinc-700">Cor esperada: {p.cor ?? '—'}</p>
                <div className="mt-3">
                  <Link href={`/filhotes/${p.slug}`} className="text-emerald-700 underline">Ver detalhes da ninhada</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <RelatedPages links={[
        { label: 'Filhotes disponíveis', href: '/filhotes', desc: 'Lista completa de filhotes e status' },
        { label: 'Como escolher um filhote', href: '/guias/como-escolher-spitz-alemao-anao', desc: 'Guia completo para escolher seu filhote' },
      ]} />
    </main>
  );
}
