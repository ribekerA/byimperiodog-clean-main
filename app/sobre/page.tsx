
import { CheckCircle, Heart, Home, PawPrint, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/route";
import { buildLocalBusinessLD } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Sobre a By Império Dog | Canil Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista desde 2012",
  description:
    "Conheça a história da By Império Dog: 10+ anos criando Spitz Alemão Anão (Lulu da Pomerânia) com responsabilidade em Bragança Paulista, SP. Metodologia familiar, pedigree CBKC e mentoria vitalícia para tutores de todo o Brasil.",
  keywords: [
    "criador Spitz Alemão Anão confiável", "canil Lulu da Pomerânia Bragança Paulista",
    "By Império Dog sobre", "história canil Spitz Alemão SP",
    "canil responsável CBKC interior SP",
  ],
  alternates: { canonical: "/sobre" },
  openGraph: {
    type: "website",
    url: "/sobre",
    title: "Sobre a By Império Dog — Canil Spitz Alemão Anão (Lulu da Pomerânia), Bragança Paulista desde 2012",
    description:
      "10+ anos criando Spitz Alemão Anão (Lulu da Pomerânia) com responsabilidade. Metodologia familiar, pedigree CBKC e mentoria vitalícia.",
  },
};

const timeline = [
  {
    year: "2012",
    title: "Primeiros passos com amor à raça",
    description:
      "A família Império recebeu a primeira fêmea de Spitz Alemão Anão Lulu da Pomerânia e iniciou estudos com mentores europeus sobre genética, manejo e padrões da raça.",
  },
  {
    year: "2016",
    title: "Certificações e planejamento genético",
    description:
      "A criação foi homologada pela CBKC, com matrizes e padreadors testados para garantir saúde e temperamento equilibrado.",
  },
  {
    year: "2019",
    title: "Estrutura dedicada aos filhotes",
    description:
      "Construímos um canil integrado à residência, com ambientes climatizados, maternidade monitorada e espaço de socialização para o Spitz Alemão Anão Lulu da Pomerânia.",
  },
  {
    year: "2023",
    title: "Mentoria para tutores em todo o Brasil",
    description:
      "Lançamos nosso programa de acompanhamento vitalício, com suporte remoto, biblioteca de conteúdos e rede de parceiros especializados.",
  },
] as const;

const values = [
  {
    icon: Heart,
    title: "Afeto desde o primeiro dia",
    description:
      "Os filhotes nascem e crescem dentro de casa, ao lado da família, ouvindo vozes, música e convivendo com crianças.",
  },
  {
    icon: Users,
    title: "Famílias selecionadas",
    description:
      "Cada escolha de família é conduzida com entrevistas, orientações e acompanhamento para garantir o melhor vínculo humano-animal.",
  },
  {
    icon: Shield,
    title: "Transparência absoluta",
    description:
      "Apresentamos pedigree, exames laboratoriais, relatórios veterinários e contrato claro em cada etapa do processo.",
  },
] as const;

const structureHighlights = [
  {
    icon: Home,
    title: "Ambientes preparados",
    description: "Maternidade climatizada, nursery com enriquecimento sensorial e área externa sombreada para exploração natural.",
  },
  {
    icon: PawPrint,
    title: "Rotina positiva",
    description: "Rotina diária de socialização, estímulos olfativos e treino de superfície para facilitar a adaptação na nova casa.",
  },
  {
    icon: CheckCircle,
    title: "Rede multidisciplinar",
    description: "Equipe de veterinários, comportamentalista e groomer parceiros garantem cuidado integral aos nossos Spitz Alemão Anão Lulu da Pomerânia.",
  },
] as const;

const supportItems = [
  "Plano alimentar personalizado conforme idade e porte",
  "Calendário de vacinas, vermifugações e consultas",
  "Conteúdos exclusivos sobre adestramento gentil",
  "Grupo de acompanhamento vitalício no WhatsApp",
] as const;

export default function SobrePage() {
  const trimmedPhone = process.env.NEXT_PUBLIC_WA_PHONE?.replace(/\D/g, "") ?? "";
  const waHref = trimmedPhone ? `https://wa.me/${trimmedPhone}` : process.env.NEXT_PUBLIC_WA_LINK ?? "#";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.byimperiodog.com.br";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Sobre", item: `${siteUrl}/sobre` },
    ],
  };
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/sobre#webpage`,
    url: `${siteUrl}/sobre`,
    name: "Sobre a By Império Dog",
    description:
      "Conheça a história da By Império Dog, nossa estrutura familiar e a metodologia responsável de criação do Spitz Alemão Anão Lulu da Pomerânia em Bragança Paulista.",
    isPartOf: { "@type": "WebSite", url: siteUrl, name: "By Imperio Dog" },
  };

  const businessLd = buildLocalBusinessLD();

  return (
    <main className="space-y-20 bg-[var(--bg)] pb-24 pt-16 text-[var(--text)]">
      <Script id="ld-breadcrumb-sobre" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Script id="ld-webpage-sobre"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />
      <Script id="ld-business-sobre"  type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <section className="mx-auto max-w-6xl px-5 text-center sm:text-left">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
          Sobre a criadora
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          By Império Dog: criação familiar dedicada ao Spitz Alemão Anão Lulu da Pomerânia
        </h1>
        <p className="mt-4 max-w-3xl text-base text-[var(--text-muted)] sm:text-lg">
          Localizada em Bragança Paulista, nossa criação prioriza afeto, responsabilidade genética e mentoria contínua para famílias que buscam um Spitz Alemão Anão Lulu da Pomerânia equilibrado e saudável.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 sm:justify-start">
          <Link
            href={routes.filhotes}
            className={cn(
              buttonVariants({ variant: "solid", size: "lg" }),
              "h-12 rounded-full bg-[var(--brand)] px-6 text-[var(--brand-foreground)] shadow-md hover:shadow-lg"
            )}
          >
            Conhecer filhotes disponíveis
          </Link>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 rounded-full border-[var(--brand)] px-6 text-[var(--brand)] hover:bg-[var(--surface-2)]"
            )}
          >
            Falar com a criadora
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <h2 className="text-2xl font-semibold text-[var(--text)]">Nossa história</h2>
        <ol className="mt-6 space-y-6 border-l border-dashed border-[var(--border)] pl-6" aria-label="Linha do tempo">
          {timeline.map((item) => (
            <li key={item.year} className="relative rounded-2xl bg-[var(--surface)] p-6 shadow-sm">
              <span className="absolute -left-[37px] top-6 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-semibold text-[var(--brand-foreground)] shadow">
                {item.year}
              </span>
              <h3 className="text-lg font-semibold text-[var(--text)]">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{item.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-5">
        <h2 className="text-2xl font-semibold text-[var(--text)]">Como cuidamos dos nossos Spitz Alemão Anão Lulu da Pomerânia</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {values.map((value) => (
            <article key={value.title} className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <value.icon className="h-6 w-6 text-[var(--brand)]" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">{value.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl grid gap-8 px-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-5">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Estrutura pensada para bem-estar e socialização</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Mantemos poucos cães adultos para garantir atenção individualizada. Cada ambiente é higienizado diariamente e monitorado por câmeras, garantindo segurança mesmo quando estamos fora de casa.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {structureHighlights.map((item) => (
              <article key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
                <item.icon className="h-5 w-5 text-[var(--brand)]" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--text)]">Rede de suporte ao tutor</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Após a chegada do Spitz Alemão Anão Lulu da Pomerânia, você continua próximo da nossa equipe e especialistas parceiros.
          </p>
          <ul className="mt-4 space-y-3">
            {supportItems.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[var(--text)]">
                <CheckCircle className="mt-1 h-4 w-4 flex-none text-[var(--brand)]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--brand)]/40 bg-[var(--surface-2)] p-4 text-sm text-[var(--text-muted)]">
            <strong className="block text-[var(--text)]">Mentoria vitalícia</strong>
            Tutores têm acesso ao nosso plantão via WhatsApp e encontros virtuais para tirar dúvidas sempre que necessário.
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-5xl px-5">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm sm:p-10">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Quer entender se um Spitz Alemão Anão Lulu da Pomerânia da By Império Dog combina com sua família?</h2>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Agende uma conversa franca com a criadora, conheça nossa estrutura em vídeo e receba recomendações personalizadas.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "solid", size: "lg" }),
                "h-12 rounded-full bg-[var(--accent)] px-6 text-[var(--accent-foreground)] shadow-md hover:brightness-110"
              )}
            >
              <WAIcon size={18} className="mr-2 inline h-4 w-4" aria-hidden />
              Conversar agora
            </a>
            <Link
              href={routes.contato}
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "h-12 rounded-full px-6 text-[var(--text)] hover:bg-[var(--surface-2)]"
              )}
            >
              Ver canais de contato
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
