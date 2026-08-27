"use client";

import { CheckCircle2, HeartHandshake, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buttonVariants } from "@/components/ui/button";
import { FOUNDING_YEAR } from "@/domain/config";
import { useWhatsAppLink } from "@/hooks/useWhatsAppLink";
import { cn } from "@/lib/cn";
import { HERO_IMAGE_SIZES } from "@/lib/image-sizes";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import heroDesktop from "@/public/spitz-hero-desktop.webp";

const SELLING_POINTS = [
  {
    icon: ShieldCheck,
    title: "Saúde acompanhada",
    description: "Hemograma e acompanhamento veterinário. Registro oficial incluso, com emissão e entrega conforme o prazo da entidade responsável e as condições previstas em contrato.",
  },
  {
    icon: HeartHandshake,
    title: "Mentoria pós-venda",
    description: "Acompanhamento direto pelo WhatsApp para rotina, nutrição e comportamento.",
  },
  {
    icon: CheckCircle2,
    title: "Dentro do padrão FCI",
    description: "Padrão FCI nº 97 como referência de criação: altura na cernelha de 21 cm ± 3 cm.",
  },
] as const;

// "10+ anos" envelhece sozinho e conflitava com "13 anos" em outras páginas.
// O ano de fundação é fato fixo e não precisa de manutenção.
const STATS = [
  { value: `Desde ${FOUNDING_YEAR}`, label: "criando Spitz Alemão Anão" },
  { value: "Todo o Brasil", label: "área de atendimento" },
  { value: "24h", label: "suporte humano dedicado" },
] as const;

const primaryWhatsApp = buildWhatsAppLink({
  message:
    "Olá! Quero saber quais Spitz Alemão Anão estão disponíveis na By Império Dog.",
  utmSource: "site",
  utmMedium: "hero",
  utmCampaign: "hero_primary_cta",
  utmContent: "whatsapp_button",
});

const secondaryWhatsApp = buildWhatsAppLink({
  message:
    "Olá! Vi a seção de mentoria e gostaria de conversar agora sobre disponibilidade e próximos passos.",
  utmSource: "site",
  utmMedium: "hero",
  utmCampaign: "hero_secondary_cta",
  utmContent: "whatsapp_link",
});

export default function HeroSection() {
  const trackedPrimaryWhatsApp = useWhatsAppLink(primaryWhatsApp);
  const trackedSecondaryWhatsApp = useWhatsAppLink(secondaryWhatsApp);
  // "saúde validada" e "ainda dá tempo" prometiam o que nao da para sustentar:
  // um selo que ninguem emite e um prazo que nao existe.
  const [greeting, setGreeting] = useState(
    "Converse com a criadora sobre as opções atuais e a documentação de cada um.",
  );
  useEffect(() => {
    const hora = new Date().getHours();
    if (hora < 12) setGreeting("Bom dia! Veja a vitrine de filhotes e fale direto com a criadora.");
    else if (hora < 18) setGreeting("Boa tarde! Veja a vitrine de filhotes e fale direto com a criadora.");
    else setGreeting("Boa noite! Deixe a sua mensagem e a criadora responde pelo WhatsApp.");
  }, []);

  return (
    <section
      className="relative isolate overflow-hidden bg-gradient-to-br from-[#fbefe3] via-[#fdf7ee] to-[#ffffff] text-zinc-900"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr,1fr] lg:items-center lg:gap-16 lg:py-20">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700 shadow-sm">
            Criação especializada em Spitz Alemão Anão desde {FOUNDING_YEAR}
          </span>

          <header className="space-y-5">
            <h1 id="hero-heading" className="text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
              Spitz Alemão Anão (Lulu da Pomerânia) criado em família em Bragança Paulista, SP
            </h1>
            <p className="text-base leading-relaxed text-zinc-600 sm:text-lg">{greeting}</p>
            <p className="text-base leading-relaxed text-zinc-600 sm:text-lg">
              Filhotes criados dentro de casa, entregues com registro oficial, consulta veterinária e
              carteira de vacinação — e com a criadora disponível pelo WhatsApp depois da entrega.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            {SELLING_POINTS.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                  className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-white/95 p-4 shadow-sm transition hover:shadow-md focus-within:shadow-md"
              >
                <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
                  <p className="text-sm leading-relaxed text-zinc-600">{description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={trackedPrimaryWhatsApp}
              data-wa-placement="hero"
                className={cn(
                buttonVariants({ size: "lg" }),
                "min-h-[52px] w-full sm:w-auto sm:px-8 bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
              )}
            >
              <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
              Conversar no WhatsApp
            </a>
            <Link
              href="#filhotes"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-emerald-300 bg-white px-6 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 sm:w-auto"
            >
              Ver a vitrine de filhotes
            </Link>
          </div>

          <ul className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-emerald-700">
            <li>Entrega humanizada</li>
            <li className="text-zinc-600" aria-hidden="true">
              •
            </li>
            <li>Mentoria pós-venda</li>
            <li className="text-zinc-600" aria-hidden="true">
              •
            </li>
            <li>Valores publicados por cor e sexo</li>
          </ul>

          <dl className="grid gap-4 sm:grid-cols-3" aria-label="Indicadores de confiança">
            {STATS.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                <dt className="text-xs uppercase tracking-[0.24em] text-zinc-500">{stat.label}</dt>
                <dd className="mt-2 text-2xl font-semibold text-zinc-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-6">
          <figure className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-white shadow-2xl">
            <div className="relative aspect-[4/3]">
              <Image
                src={heroDesktop}
                alt="Filhote de Spitz Alemão Anão creme no colo da criadora, em sala clara com tapete branco"
                fill
                priority
                fetchPriority="high"
                sizes={HERO_IMAGE_SIZES}
                className="object-cover"
                placeholder="blur"
                style={{ contentVisibility: "auto" }}
              />
            </div>
            <figcaption className="absolute bottom-3 left-3 rounded-full bg-white px-4 py-1 text-xs font-semibold text-emerald-700 shadow">
              Filhotes criados dentro de casa
            </figcaption>
          </figure>

          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-900">Atendimento humano pelo WhatsApp</p>
                <p className="text-xs leading-relaxed text-zinc-600">
                  Tire dúvidas sobre disponibilidade, documentação e valores direto com a criadora.
                  Atendimento todos os dias, das 8h às 22h.
                </p>
              </div>
              <a
                href={trackedSecondaryWhatsApp}
                data-wa-placement="hero"
                  className="inline-flex min-h-[48px] items-center gap-2 text-sm font-semibold text-emerald-800 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                Falar agora
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
