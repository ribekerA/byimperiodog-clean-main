import { CheckCircle, MapPin, Phone, Shield, Star, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import PuppiesGrid from "@/components/PuppiesGrid";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { canonical } from "@/lib/seo.core";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.byimperiodog.com.br";
const WA_PHONE = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") || "5511968633239";
const WA_LINK = `https://wa.me/${WA_PHONE}`;

export const metadata: Metadata = {
  title: "Filhotes de Spitz Alemão Anão (Lulu da Pomerânia) em Minas Gerais (MG) | By Imperio Dog",
  description:
    "Compre filhotes de Spitz Alemão Anão (Lulu da Pomerânia) em Minas Gerais com entrega segura em BH, Uberlândia, Juiz de Fora e todo o estado. Pedigree CBKC e suporte vitalício.",
  alternates: { canonical: canonical("/filhotes/minas-gerais") },
  openGraph: {
    type: "website",
    url: canonical("/filhotes/minas-gerais"),
    title: "Filhotes de Spitz Alemão (Lulu da Pomerânia) em Minas Gerais",
    description: "Compre Spitz Alemão (Lulu da Pomerânia) com entrega em todo MG. Criadora certificada CBKC.",
    images: [{ url: "/spitz-hero-desktop.webp", width: 1200, height: 630 }],
  },
};

const mgCities = [
  "Belo Horizonte",
  "Região Metropolitana de BH",
  "Contagem",
  "Betim",
  "Uberlândia",
  "Juiz de Fora",
  "Montes Claros",
  "Uberaba",
  "Governador Valadares",
  "Ipatinga",
  "Divinópolis",
  "Poços de Caldas",
];

const faqMG = [
  {
    question: "Vocês fazem entrega em Minas Gerais?",
    answer:
      "Sim! Fazemos entrega em todo o estado de Minas Gerais, incluindo Belo Horizonte, região metropolitana, Uberlândia, Juiz de Fora e demais cidades. A entrega é segura, com transporte especializado para filhotes.",
  },
  {
    question: "Posso visitar o criatório antes de comprar?",
    answer:
      "Sim! Nosso criatório fica em Bragança Paulista (SP), a cerca de 200km de BH pela Fernão Dias. Recebemos visitas agendadas para que você conheça nossa estrutura, os filhotes e os pais. Muitos tutores de MG fazem a visita e aproveitam para buscar o filhote pessoalmente.",
  },
  {
    question: "Qual o prazo de entrega para Minas Gerais?",
    answer:
      "O prazo varia conforme a cidade. Para BH e região metropolitana geralmente é de 1-2 dias úteis após a confirmação. Para interior de MG pode variar. Consultenos via WhatsApp para detalhes sobre sua cidade.",
  },
  {
    question: "O que está incluso na compra do filhote?",
    answer:
      "Todos os filhotes vêm com pedigree CBKC, primeira dose da vacina V10, vermifugação completa, atestado veterinário, contrato, manual do tutor e suporte vitalício via WhatsApp. Também fornecemos orientação sobre alimentação e cuidados.",
  },
  {
    question: "Qual o tamanho e peso do Spitz Alemão (Lulu da Pomerânia) adulto?",
    answer:
      "O Spitz Alemão Anão (Lulu da Pomerânia) atinge de 18cm a 22cm de altura quando adulto, pesando entre 1,5kg e 3,5kg. São cães de porte mini, perfeitos para apartamentos e casas em MG.",
  },
];

export default function FilhotesMinasGeraisPage() {
  const waText = "Olá! Gostaria de informações sobre filhotes de Spitz Alemão (Lulu da Pomerânia) disponíveis em Minas Gerais.";
  const waLink = `${WA_LINK}?text=${encodeURIComponent(waText)}`;

  // Local Business JSON-LD específico para MG
  const localBusinessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/filhotes/minas-gerais#localbusiness`,
    name: "By Imperio Dog - Filhotes em Minas Gerais",
    url: `${SITE_URL}/filhotes/minas-gerais`,
    image: `${SITE_URL}/spitz-hero-desktop.webp`,
    telephone: "+55 11 96863-3239",
    address: {
      "@type": "PostalAddress",
      addressRegion: "MG",
      addressLocality: "Belo Horizonte",
      addressCountry: "BR",
    },
    areaServed: {
      "@type": "State",
      name: "Minas Gerais",
      containsPlace: mgCities.map((city) => ({
        "@type": "City",
        name: city,
      })),
    },
    priceRange: "$$$",
  };

  // FAQ Schema
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqMG.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  // Breadcrumb
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Filhotes", item: `${SITE_URL}/filhotes` },
      { "@type": "ListItem", position: 3, name: "Minas Gerais", item: `${SITE_URL}/filhotes/minas-gerais` },
    ],
  };

  return (
    <>
      <Script
        id="localbusiness-mg-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessLd) }}
      />
      <Script
        id="faq-mg-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Script
        id="breadcrumb-mg-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <main className="bg-[var(--bg)] pb-24 pt-16">
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-5 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-[var(--brand)]" />
            Atendemos todo Minas Gerais
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
            Filhotes de Spitz Alemão Anão (Lulu da Pomerânia)
            <span className="block text-[var(--brand)]">em Minas Gerais (MG)</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-[var(--text-secondary)]">
            Compre seu Spitz Alemão Anão (Lulu da Pomerânia) com segurança e entrega em BH, Uberlândia, Juiz de Fora e
            todo o estado de Minas Gerais. Criadora certificada CBKC com suporte vitalício.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 bg-[#25D366] hover:bg-[#20BA5A]")}
            >
              <WhatsAppIcon className="h-5 w-5" />
              Falar com a Criadora
            </a>
            <Link href="#filhotes-disponiveis" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Ver Filhotes Disponíveis
            </Link>
          </div>
        </section>

        {/* Atendimento em MG */}
        <section className="mx-auto mt-20 max-w-6xl px-5">
          <h2 className="mb-8 text-center text-3xl font-bold text-[var(--text)]">
            Atendemos Todo o Estado de Minas Gerais
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mgCities.map((city) => (
              <div
                key={city}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-[var(--brand)]" />
                <span className="font-medium text-[var(--text)]">{city}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Diferenciais */}
        <section className="mx-auto mt-20 max-w-6xl px-5">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/10">
                <Truck className="h-8 w-8 text-[var(--brand)]" />
              </div>
              <h3 className="mb-2 font-bold text-[var(--text)]">Entrega Segura</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Transporte especializado para filhotes em todo MG
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/10">
                <Shield className="h-8 w-8 text-[var(--brand)]" />
              </div>
              <h3 className="mb-2 font-bold text-[var(--text)]">Pedigree CBKC</h3>
              <p className="text-sm text-[var(--text-secondary)]">Todos os filhotes com registro oficial</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/10">
                <Star className="h-8 w-8 text-[var(--brand)]" />
              </div>
              <h3 className="mb-2 font-bold text-[var(--text)]">Criadora de Referência</h3>
              <p className="text-sm text-[var(--text-secondary)]">Anos de experiência e tutores satisfeitos em MG</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)]/10">
                <Phone className="h-8 w-8 text-[var(--brand)]" />
              </div>
              <h3 className="mb-2 font-bold text-[var(--text)]">Suporte Vitalício</h3>
              <p className="text-sm text-[var(--text-secondary)]">Acompanhamento permanente após a compra</p>
            </div>
          </div>
        </section>

        {/* Filhotes Disponíveis */}
        <section id="filhotes-disponiveis" className="mx-auto mt-20 max-w-7xl px-5">
          <h2 className="mb-8 text-center text-3xl font-bold text-[var(--text)]">Filhotes Disponíveis</h2>
          <PuppiesGrid />
        </section>

        {/* FAQ */}
        <section className="mx-auto mt-20 max-w-4xl px-5">
          <h2 className="mb-8 text-center text-3xl font-bold text-[var(--text)]">
            Perguntas Frequentes - Minas Gerais
          </h2>
          <div className="space-y-4">
            {faqMG.map((item, idx) => (
              <details
                key={idx}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--brand)]"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-4 font-semibold text-[var(--text)] marker:content-none">
                  <span>{item.question}</span>
                  <span className="flex-shrink-0 text-[var(--brand)] transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-[var(--text-secondary)]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section className="mx-auto mt-20 max-w-4xl px-5 text-center">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-[var(--text)]">Pronto para ter seu Spitz Alemão (Lulu da Pomerânia) em Minas Gerais?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
              Fale agora com nossa equipe e garanta seu filhote com entrega segura em todo MG
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "mt-6 gap-2 bg-[#25D366] hover:bg-[#20BA5A]")}
            >
              <WhatsAppIcon className="h-5 w-5" />
              Falar no WhatsApp
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
