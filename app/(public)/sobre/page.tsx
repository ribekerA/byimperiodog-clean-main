import {
  CheckCircle,
  Heart,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { WhatsAppIcon as WAIcon } from "@/components/icons/WhatsAppIcon";
import TextTestimonials from "@/components/sections/TextTestimonials";
import { FOUNDING_YEAR } from "@/domain/config";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildLocalBusinessLD } from "@/lib/structured-data";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://byimperiodog.com.br").replace(/\/$/, "");

export const metadata: Metadata = {
  // 81 caracteres com o sufixo da marca: o Google cortava o fim. Aqui o nome
  // usado e o sinonimo, nao o termo principal, porque /sobre disputa consulta
  // de marca e nao a de raca — essa e a /spitz-alemao. Assim o titulo cabe
  // inteiro sem separar "Spitz Alemão Anão" de "Lulu da Pomerânia".
  title: `Sobre o canil — Lulu da Pomerânia desde ${FOUNDING_YEAR}`,
  description:
    // 202 caracteres. Reescrita em 152, e o ano deixa de ser literal: passa a
    // vir do FOUNDING_YEAR como no resto do site.
    `A história da By Império Dog: desde ${FOUNDING_YEAR} criando Spitz Alemão Anão (Lulu da Pomerânia) em Bragança Paulista, SP, com criação familiar e registro oficial.`,
  keywords: [
    "criador Spitz Alemão Anão confiável",
    "canil Lulu da Pomerânia Bragança Paulista",
    "By Império Dog sobre",
    "história canil Spitz Alemão SP",
    "canil responsável interior SP",
  ],
  alternates: { canonical: `${SITE_URL}/sobre` },
  openGraph: {
    images: [OG_DEFAULT_IMAGE],
    type: "website",
    url: `${SITE_URL}/sobre`,
    title: `Sobre a By Império Dog — criando Spitz Alemão Anão (Lulu da Pomerânia) desde ${FOUNDING_YEAR}`,
    description:
      `Desde ${FOUNDING_YEAR} criando Spitz Alemão Anão (Lulu da Pomerânia) com responsabilidade. Metodologia familiar, registro oficial e mentoria vitalícia.`,
  },
};

const TIMELINE = [
  {
    year: String(FOUNDING_YEAR),
    title: "O primeiro Spitz chegou",
    description:
      "Por puro amor à raça, a família Império recebeu a primeira fêmea de Spitz Alemão Anão (Lulu da Pomerânia) e começou um longo estudo sobre genética, saúde e padrões da raça.",
    emoji: "🐾",
  },
  {
    year: "2015",
    title: "Primeira ninhada registrada",
    description:
      "A primeira ninhada com registro oficial saiu da By Império Dog. Um marco que estabeleceu o compromisso com a rastreabilidade e o acompanhamento veterinário.",
    emoji: "📋",
  },
  {
    year: "2018",
    title: "100 famílias atendidas",
    description:
      "Atingimos a marca de 100 famílias em todo o Brasil. Cada entrega foi acompanhada de perto, com contrato claro e suporte pós-entrega.",
    emoji: "🏡",
  },
  // O marco de 2022 anunciava "maternidade monitorada com cameras, ambiente
  // climatizado e espaco de socializacao sensorial". Nao existe estrutura
  // nenhuma desse tipo — a responsavel confirmou. Nao da para reescrever o
  // item, porque nao ha outro acontecimento verificavel para ocupar 2022, e
  // inventar um seria trocar uma mentira por outra. A linha do tempo segue
  // com os marcos que se sustentam.
  {
    // Ultimo item da linha do tempo nao e um marco datado: e o estado atual --
    // a propria descricao comeca com "Hoje". Estava escrito "2026", entao na
    // virada do ano a linha do tempo passaria a anunciar que o ultimo
    // acontecimento do canil foi no ano passado. "Hoje" nao envelhece.
    year: "Hoje",
    title: "Mais de 180 famílias felizes",
    description:
      "Hoje, mais de 180 famílias espalhadas pelo Brasil confiam na By Império Dog para escolher seu Spitz Alemão Anão (Lulu da Pomerânia). E cada uma recebe mentoria vitalícia.",
    emoji: "💚",
  },
] as const;

const VALUES = [
  {
    icon: Shield,
    title: "Transparência absoluta",
    description:
      "Registro oficial, laudos de saúde, contratos claros e nada de surpresas. Você sabe o que está levando para casa.",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    icon: Heart,
    title: "Vínculo desde o nascimento",
    description:
      "Os filhotes crescem dentro de casa, ao lado da família — com música, vozes, crianças e afeto desde o primeiro dia.",
    color: "bg-rose-50 text-rose-700 border-rose-100",
  },
  {
    icon: CheckCircle,
    title: "Saúde acompanhada",
    description:
      "Hemograma e acompanhamento veterinário antes da entrega. Saúde não é opcional.",
    color: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    icon: Users,
    title: "Suporte vitalício",
    description:
      "Você não fica sozinho depois da entrega. Atendimento direto por WhatsApp com a criadora para tirar dúvidas quando precisar.",
    color: "bg-violet-50 text-violet-700 border-violet-100",
  },
] as const;

// A coluna da direita descrevia o que "criadores comuns" fazem de errado —
// recibo informal, canil segregado, nenhum laudo. É acusação genérica sobre
// terceiros que não temos como verificar, e o comparativo continua útil sem
// ela. Virou checklist do que o comprador deve confirmar em qualquer criador,
// inclusive aqui. A coluna da esquerda também perdeu o que não é verificável
// publicamente ("SBK", "exames genéticos", "protocolo ENS") e ficou só com o
// que os documentos entregues comprovam.
//
// Segunda passagem, com a responsável confirmando o que existe de fato:
// - "exames genéticos e cardiológicos" viraram "hemograma e acompanhamento
//   veterinário", que é o que realmente se faz antes da entrega;
// - "grupo de WhatsApp", "biblioteca de conteúdos" e "parceiros especializados"
//   saíram — não existem. O que existe é atendimento direto com a criadora;
// - "cláusulas de devolução" saiu porque o contrato não tem essa cláusula.
//   Sobrou o que o contrato de fato é: assinado antes da entrega, por escrito.
const DIFERENCIAIS = [
  {
    label: "Registro oficial",
    us: "Pedigree emitido pela CBKC ou por clube filiado, dentro do sistema FCI",
    check: "Peça o número do registro e confirme qual entidade emitiu",
  },
  {
    label: "Saúde documentada",
    us: "Laudo de saúde, hemograma e carteira de vacinação assinada pelo médico-veterinário",
    check: "Confira quais exames foram feitos e quem assinou cada documento",
  },
  {
    label: "Suporte após a entrega",
    us: "Mentoria vitalícia com atendimento direto por WhatsApp",
    check: "Pergunte por quanto tempo o suporte continua depois da entrega",
  },
  {
    label: "Contrato claro",
    us: "Contrato digital assinado antes da entrega, com as condições por escrito",
    check: "Leia o contrato inteiro antes de pagar o sinal",
  },
  {
    label: "Socialização",
    us: "Filhotes criados em convívio familiar desde o nascimento",
    check: "Pergunte onde os filhotes passam o dia e com quem convivem",
  },
] as const;

export default function SobrePage() {
  const waLink = buildWhatsAppLink({
    message: "Olá! Quero conhecer mais sobre a criadora e o processo da By Império Dog.",
    utmSource: "sobre",
    utmCampaign: "sobre-cta",
  });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Sobre", item: `${SITE_URL}/sobre` },
    ],
  };
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/sobre#webpage`,
    url: `${SITE_URL}/sobre`,
    name: "Sobre a By Império Dog",
    description:
      `Desde ${FOUNDING_YEAR} criando Spitz Alemão Anão (Lulu da Pomerânia) com responsabilidade. Metodologia familiar, registro oficial e mentoria vitalícia em Bragança Paulista.`,
    isPartOf: { "@type": "WebSite", url: SITE_URL, name: "By Império Dog" },
  };

  const businessLd = buildLocalBusinessLD();

  return (
    <div>
      <script id="ld-breadcrumb-sobre" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script id="ld-webpage-sobre" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />
      <script id="ld-business-sobre" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />

      {/* ── Hero pessoal ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-zinc-900 px-5 py-20 sm:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 50%, #059669 0%, transparent 55%), radial-gradient(ellipse at 80% 30%, #065f46 0%, transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/50 bg-emerald-900/40 px-4 py-1 text-xs font-bold uppercase tracking-widest text-emerald-300">
            Nossa história
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Comecei em {FOUNDING_YEAR} por amor à raça.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-300 sm:text-xl">
            Hoje, cada filhote que sai daqui carrega{" "}
            <strong className="text-emerald-400">mais de uma década de aprendizado</strong>,
            afeto e responsabilidade genética.
          </p>
          <p className="mt-4 max-w-xl text-zinc-400 leading-relaxed">
            A By Império Dog nasceu em Bragança Paulista, SP, de uma paixão genuína pelo
            Spitz Alemão Anão (Lulu da Pomerânia). Não somos uma fábrica de filhotes —
            somos uma família que escolheu fazer isso com seriedade.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition px-6 py-3 text-sm font-semibold text-white shadow-lg"
            >
              <WAIcon size={18} aria-hidden />
              Falar com a criadora
            </a>
            <Link
              href="/filhotes"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-600 hover:border-emerald-600 transition px-6 py-3 text-sm font-semibold text-zinc-300 hover:text-white"
            >
              Ver filhotes disponíveis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────────────────────── */}
      <section className="bg-white px-5 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Nossa trajetória</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Desde {FOUNDING_YEAR} construindo confiança
            </h2>
          </div>
          <ol className="relative space-y-0" aria-label="Linha do tempo da By Império Dog">
            {TIMELINE.map((item, i) => (
              <li key={item.year} className="relative flex gap-6 pb-10 last:pb-0">
                {/* Vertical line */}
                {i < TIMELINE.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-emerald-100" aria-hidden />
                )}
                {/* Circle */}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 shadow-sm">
                  <span className="text-base" aria-hidden>{item.emoji}</span>
                </div>
                <div className="flex-1 pt-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">{item.year}</span>
                  <h3 className="mt-1 text-lg font-bold text-zinc-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Valores ──────────────────────────────────────────────────────────── */}
      <section className="bg-zinc-50 px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">O que nos guia</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Nossos valores
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <article
                key={value.title}
                className={`flex flex-col gap-4 rounded-2xl border p-6 transition hover:shadow-md ${value.color}`}
              >
                <value.icon className="h-7 w-7" aria-hidden />
                <div>
                  <h3 className="font-bold text-base">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-80">{value.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Diferenciais comparativos ─────────────────────────────────────────── */}
      <section className="bg-white px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Comparativo</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              O que verificar antes de escolher
            </h2>
            <p className="mt-3 text-zinc-500">
              Use esta lista para comparar qualquer criador — inclusive nós.
            </p>
          </div>

          {/* Antes havia dois blocos com o mesmo conteúdo: cards em `sm:hidden`
              e tabela em `hidden sm:block`. Os dois iam para o HTML, então o
              comparativo inteiro aparecia duplicado no código-fonte da página.
              Agora o texto é escrito uma vez só e apenas o layout muda por CSS:
              cards empilhados abaixo de sm, grade de 3 colunas a partir de sm. */}
          <div className="space-y-3 sm:space-y-0 sm:overflow-hidden sm:rounded-2xl sm:border sm:border-zinc-100 sm:shadow-sm">
            {/* Cabeçalho: só existe no layout de colunas. Abaixo de sm, cada
                card repete os rótulos inline. */}
            <div className="hidden grid-cols-[1.5fr,1fr,1fr] bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500 sm:grid">
              <div className="px-5 py-3">Critério</div>
              <div className="px-5 py-3 text-emerald-700">By Império Dog</div>
              <div className="px-5 py-3 text-zinc-400">O que confirmar em qualquer criador</div>
            </div>

            {DIFERENCIAIS.map((row, i) => (
              <article
                key={row.label}
                className={`rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm sm:grid sm:grid-cols-[1.5fr,1fr,1fr] sm:rounded-none sm:border-0 sm:border-t sm:p-0 sm:shadow-none ${
                  i % 2 === 0 ? "sm:bg-white" : "sm:bg-zinc-50/50"
                }`}
              >
                <h3 className="text-sm font-bold text-zinc-800 sm:flex sm:items-start sm:px-5 sm:py-4 sm:font-semibold">
                  {row.label}
                </h3>
                <div className="mt-3 flex items-start gap-2 sm:mt-0 sm:px-5 sm:py-4">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 sm:hidden">
                      By Império Dog
                    </p>
                    <p className="text-sm text-zinc-700">{row.us}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 sm:mt-0 sm:px-5 sm:py-4">
                  {/* Era um "×", que fazia sentido quando a coluna listava o que
                      outros criadores deixam de fazer. Agora são perguntas a
                      fazer, então a seta indica ação em vez de reprovação. */}
                  <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-lg leading-none text-zinc-300" aria-hidden>
                    →
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 sm:hidden">
                      O que confirmar
                    </p>
                    <p className="text-sm text-zinc-400">{row.check}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Depoimentos ──────────────────────────────────────────────────────── */}
      <section className="bg-emerald-50 px-5 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-2 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Famílias reais</span>
          </div>
        </div>
        <TextTestimonials />
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-5 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <Sparkles className="mx-auto mb-4 h-8 w-8 text-emerald-200" aria-hidden />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Veja os filhotes disponíveis hoje
          </h2>
          <p className="mt-4 text-emerald-100">
            Cada ninhada é única. Não deixe para amanhã a conversa que pode mudar a vida da sua família.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/filhotes"
              className="rounded-full bg-white px-8 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-lg"
            >
              Ver filhotes disponíveis
            </Link>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              <WAIcon size={18} aria-hidden />
              Conversar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
