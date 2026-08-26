import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import ColorGallery from "@/components/sections/ColorGallery";
import {
  ClientOnlyAiMatchmakerChat,
  ClientOnlyTextTestimonials,
  ClientOnlyTestimonials,
} from "@/components/sections/HomeClientOnly";
import HomeFAQ from "@/components/sections/HomeFAQ";
import NinhadaAlert from "@/components/sections/NinhadaAlert";
import PriceTransparency from "@/components/sections/PriceTransparency";
import VideoHero from "@/components/sections/VideoHero";
import { HOME_FAQ_ITEMS } from "@/content/home-faq-items";
import { puppiesPublicados } from "@/content/puppies-static";
import { FOUNDING_YEAR } from "@/domain/config";
import { formatarPreco } from "@/domain/pricing";
import { focoDaFoto } from "@/lib/photo-focus";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  // O `template: '%s | By Império Dog'` fica em baseSiteMetadata, no layout do
  // segmento (public). No Next.js o template só alcança segmentos FILHOS, então
  // /filhotes recebia a marca e a home — que é a página do próprio segmento —
  // saía sem. Resultado: as buscas por "Império Dog" apareciam na posição 7 e
  // não geravam clique, porque o nome não estava no título do resultado.
  // Escrever a marca aqui não duplica nada, justamente porque o template não
  // se aplica a esta página.
  title: "Canil Spitz Alemão Anão em Bragança Paulista | By Império Dog",
  // A description tinha 218 caracteres. O Google corta perto de 155 (menos
  // ainda no celular, de onde vêm 90% dos cliques), então "13 anos, 180+
  // famílias. Entregamos em todo o Brasil." nunca chegava a ser lido. Encurtada
  // para caber inteira, mantendo "Lulu da Pomerânia" — que sai do título por
  // falta de espaço, mas é o nome pelo qual a raça é de fato pesquisada.
  description:
    "Canil de Spitz Alemão Anão em Bragança Paulista, SP. Registro oficial, consulta veterinária e hemograma completo. Enviamos para todo o Brasil.",
  keywords: [
    "Spitz Alemão Anão", "Lulu da Pomerânia", "Pomeranian",
    "filhote Spitz Alemão", "canil Bragança Paulista",
    "canil Spitz Alemão SP", "Lulu da Pomerânia à venda SP",
    "comprar Spitz Alemão Anão", "canil confiável Spitz",
    "registro oficial Spitz Alemão Anão", "Lulu da Pomerânia interior SP",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "By Império Dog | Spitz Alemão Anão — Bragança Paulista, SP",
    description:
      `Canil especializado em Spitz Alemão Anão em Bragança Paulista, SP. Registro oficial, consulta veterinária e hemograma completo inclusos. Criação desde ${FOUNDING_YEAR}, com contrato.`,
    // `/og/home.jpg` nunca existiu: a pasta public/og/ não existe no repositório
    // e o arquivo respondia 404. Toda pré-visualização de link da home saía sem
    // imagem. Agora aponta para o arquivo real de 1200x630.
    images: [{ url: OG_DEFAULT_IMAGE.url, width: OG_DEFAULT_IMAGE.width, height: OG_DEFAULT_IMAGE.height, alt: "Spitz Alemão Anão da By Império Dog, Bragança Paulista SP" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "By Império Dog | Spitz Alemão Anão",
    description: "Criação responsável em Bragança Paulista, SP. Registro oficial, consulta veterinária e hemograma completo inclusos.",
    images: [OG_DEFAULT_IMAGE.url],
  },
};

// Formatacao de preco vem do dominio, nao daqui.
//
// Este arquivo tinha o seu proprio Intl.NumberFormat com style: "currency".
// Aquele formato separa "R$" do numero com espaco sem quebra (U+00A0), e o
// resto do site escreve "R$ 9.500" com espaco comum. Os dois sao identicos na
// tela e diferentes como texto: a pagina do filhote publicava o preco com
// U+00A0 enquanto a tabela publicava com espaco comum, e nenhuma checagem de
// texto conseguia ligar os dois. formatarPreco e a unica forma reconhecida.
function formatPrice(cents: number) {
  return formatarPreco(cents);
}

// Links estratégicos — PageRank distribution para landing pages
const RACE_LINKS = [
  { emoji: "🐾", label: "Spitz Alemão Anão — A Raça", href: "/spitz-alemao",              desc: "Lulu da Pomerânia — origem, características, temperamento e cuidados" },
  // O rótulo era `Tabela de Preços ${new Date().getFullYear()}`. Como o ano vinha
  // do relógio, a página publicava "Tabela de Preços 2026" sem que esse texto
  // existisse em lugar nenhum do código — e viraria "2027" sozinho na virada do
  // ano. Era também a origem do "Preços 2025" reprovado na auditoria anterior:
  // mesma linha, ano diferente. Sem data, o rótulo não envelhece.
  { emoji: "💰", label: "Tabela de Preços",                                   href: "/preco-spitz-anao",          desc: "Valores por cor e sexo — sem surpresas" },
  { emoji: "🛡️", label: "Como Comprar com Segurança", href: "/comprar-spitz-anao",         desc: "Guia passo a passo para não cair em golpes" },
  { emoji: "🍼", label: "Filhote de Spitz Alemão",    href: "/filhote-de-spitz-alemao",   desc: "Lulu da Pomerânia — como escolher, primeiros cuidados e vacinação" },
  { emoji: "✅", label: "Criador Confiável",           href: "/criador-spitz-confiavel",   desc: "Documentação, exames e red flags para evitar" },
  { emoji: "📍", label: "Canil no Interior de SP",    href: "/canil-spitz-alemao-interior-sp", desc: "Cidades atendidas — Bragança Paulista e região" },
] as const;

// Diferenciais — definidos fora para evitar recriação a cada render
const DIFFERENTIALS = [
  { emoji: "🏅", title: "Registro oficial incluso", body: "Registro oficial incluso, com emissão e entrega conforme o prazo da entidade responsável e as condições previstas em contrato." },
  { emoji: "🩺", title: "Saúde documentada", body: "Consulta veterinária e hemograma completo antes da entrega, com protocolo vacinal em dia conforme a idade do filhote e carteira assinada pelo médico-veterinário." },
  { emoji: "🏡", title: "Socialização guiada", body: "Convivência com pessoas, sons e rotinas domésticas, com orientação de ambientação para a chegada na nova casa." },
  { emoji: "💬", title: "Mentoria pós-venda", body: "Suporte direto com a criadora via WhatsApp para rotina, nutrição e comportamento." },
  { emoji: "🚗", title: "Transporte orientado", body: "Orientação sobre transporte seguro, seja buscar pessoalmente ou por transportadora." },
  { emoji: "📋", title: "Lista de enxoval", body: "Lista de itens, alimentação e rotina entregue antes da chegada do filhote." },
] as const;

// Prova social — barra de trust signals
const TRUST_SIGNALS = [
  "Registro oficial",
  "Consulta veterinária e hemograma",
  "Mentoria pós-venda inclusa",
  `Criação desde ${FOUNDING_YEAR}`,
  "Envio para todo o Brasil",
] as const;

// WebSite e Organization saíram daqui: o layout público já emite os dois em
// todas as páginas, com o mesmo @id. Emitir de novo na home criava um segundo
// nó por entidade e era isso que o Search Console reportava como campo
// duplicado. O SearchAction e o speakable que existiam aqui foram levados para
// buildWebsiteLD, e o knowsAbout para buildOrganizationLD (src/lib/tracking.ts).
// O contactPoint tinha `contactOption: "TollFree"` — o WhatsApp de atendimento
// não é gratuito, então a propriedade foi removida em vez de migrada.

export default function HomePage() {

  // Todos os filhotes à venda, sem corte. Antes eram os 4 primeiros, e a home
  // se contradizia sozinha: o hero anuncia "N filhotes disponíveis agora" e a
  // seção logo abaixo mostrava 4. Quem contava percebia. Quem não contava saía
  // achando que o canil tinha metade do plantel que tem.
  const featured = puppiesPublicados.filter(
    (p) => p.status !== "sold" && p.status !== "vendido",
  );

  return (
    <>

      <div className="relative flex flex-col">

        {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
        <VideoHero />

        {/* ── 2. SOCIAL PROOF BAR ────────────────────────────────────────────── */}
        <div className="border-b border-zinc-100 bg-white py-5 overflow-hidden">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-5 text-sm text-zinc-500">
            {TRUST_SIGNALS.map((signal) => (
              <div key={signal}>
                <span className="flex items-center gap-1.5">
                  <span className="text-emerald-700" aria-hidden="true">✓</span>
                  {signal}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. FILHOTES EM DESTAQUE ─────────────────────────────────────────── */}
        <section className="home-deferred-section bg-[var(--bg)] py-14 sm:py-28 overflow-hidden" aria-labelledby="featured-heading">
          <div className="mx-auto max-w-7xl">

            {/* Header da seção */}
            <div className="mx-auto mb-8 max-w-xl px-5 text-center sm:mb-12 sm:px-8">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">
                Filhotes disponíveis
              </p>
              <h2 id="featured-heading" className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Conheça os filhotes
              </h2>
              <p className="mt-3 text-sm text-zinc-600 sm:text-base">
                Filhotes disponíveis pela By Império Dog, com acompanhamento veterinário e a documentação descrita em contrato.
              </p>
            </div>

            {/* ── Lista de filhotes — UMA única instância no DOM ──────────────
                Uma coluna no celular, um filhote por vez ocupando a largura
                toda; 2 colunas a partir de sm e 4 a partir de lg.

                Já foi carrossel horizontal aqui. A ideia era boa em teoria —
                cabe muito card em pouca tela — e ruim na prática por três
                motivos que só aparecem no aparelho: o deslize lateral disputa
                com a rolagem vertical da página e com o gesto de "voltar" do
                navegador; o card encolhia para 80% da tela, e a foto junto,
                que é o que vende; e o que não está na primeira posição some,
                então metade do plantel dependia de a pessoa adivinhar que
                havia mais coisa à direita. Empilhado, o dedo faz o gesto que
                já ia fazer e cada filhote chega em tamanho de vitrine. */}
            <div className="px-5 sm:px-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
                {featured.map((puppy) => {
                  const corLabel = (puppy as any).cor ?? puppy.color ?? "";
                  const sexRaw = puppy.sex ?? (puppy as any).gender ?? "";
                  const sexLabel = sexRaw === "female" ? "Fêmea" : sexRaw === "male" ? "Macho" : "";
                  const cover = puppy.images.find((img: string) => !img.endsWith(".mp4")) ?? puppy.images[0];
                  const price = (puppy as any).priceCents ?? (puppy as any).price_cents;
                  const isReserved = puppy.status === "reserved" || puppy.status === "reservado";
                  const waLink = buildWhatsAppLink({
                    message: `Olá! Vi o ${puppy.name} (${corLabel} ${sexLabel}) no site e quero saber mais informações.`,
                    utmSource: "site",
                    utmMedium: "featured_home",
                    utmCampaign: "filhotes",
                    utmContent: puppy.id,
                  });
                  return (
                    <div key={puppy.id}>
                      <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-900/5 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <Link href={`/filhotes/${puppy.slug}`} tabIndex={-1} aria-hidden="true">
                          {/* 4/5 em qualquer tela. O quadrado existia para
                              encolher o card do carrossel e caber o botão junto
                              na dobra; sem carrossel, a foto ganha de volta os
                              75px que ela tinha perdido — e ela é o argumento de
                              venda, não o enfeite. */}
                          <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
                            {cover && (
                              <Image
                                src={cover}
                                alt={`${puppy.name} — Spitz Alemão Anão ${corLabel} ${sexLabel}`}
                                fill
                                // O recorte vem medido por foto (src/lib/photo-focus).
                                // Um valor unico nao serve: o filhote que posa no
                                // colo esta no alto do quadro, o que posa na grama
                                // esta embaixo, e o mesmo 28% que enquadra um deixa
                                // o outro com meio card de ceu.
                                className="object-cover transition duration-500 group-hover:scale-105"
                                style={{ objectPosition: focoDaFoto(cover) }}
                                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 50vw, 25vw"
                              />
                            )}
                            <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow ${isReserved ? "bg-amber-700" : "bg-emerald-700"}`}>
                              {isReserved ? "Reservado" : "Disponível"}
                            </span>
                            {sexLabel && (
                              <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                                {sexLabel}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex flex-1 flex-col gap-3 p-4">
                          <div>
                            <Link href={`/filhotes/cor/${puppy.color}`} className="text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-emerald-700">
                              {corLabel}
                            </Link>
                            <Link href={`/filhotes/${puppy.slug}`}>
                              <h3 className="mt-0.5 text-base font-bold text-zinc-900 transition group-hover:text-emerald-700">
                                {puppy.name}
                              </h3>
                            </Link>
                          </div>
                          <div className="mt-auto">
                            {price > 0 && (
                              <p className="text-xl font-extrabold text-[var(--accent-ink)]">{formatPrice(price)}</p>
                            )}
                            <p className="text-[10px] text-zinc-500">registro oficial incluso</p>
                          </div>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            /* Todos os cards repetem "Tenho interesse" e cada um abre uma
                               conversa diferente. Sem rotulo proprio, o leitor de tela le
                               uma fila de links iguais apontando para destinos distintos. */
                            aria-label={`Tenho interesse no ${puppy.name} — falar pelo WhatsApp`}
                            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                            Tenho interesse
                          </a>
                          <Link
                            href={`/filhotes/${puppy.slug}`}
                            aria-label={`Ver galeria de ${puppy.name}`}
                            className="text-center text-xs font-medium text-zinc-500 hover:text-emerald-700 hover:underline"
                          >
                            Ver galeria →
                          </Link>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>

              {/* Dizia "Ver todos os filhotes disponíveis" quando a seção
                  mostrava 4 de 7 — e continuar dizendo isso agora seria prometer
                  uma página que não tem nada de novo. O que /filhotes tem e a
                  home não tem é o filtro por cor, então é isso que o botão
                  oferece. */}
              <div className="mt-8 text-center sm:mt-12">
                <Link
                  href="/filhotes"
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-2 border-zinc-200 px-8 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700 hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
                >
                  Filtrar filhotes por cor →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. GALERIA DE CORES ─────────────────────────────────────────────── */}
        <div className="home-deferred-section">
          <ColorGallery />
        </div>

        {/* ── 5. DIFERENCIAIS ─────────────────────────────────────────────────── */}
        <section className="home-deferred-section bg-white py-14 sm:py-28 overflow-hidden" aria-labelledby="diff-heading">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">

            <div className="mx-auto mb-8 sm:mb-12 max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Criação responsável</p>
              <h2 id="diff-heading" className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Por que a By Império Dog?
              </h2>
              <p className="mt-3 text-zinc-600 text-sm sm:text-base">
                Desde {FOUNDING_YEAR} cuidando de cada detalhe para que você receba um filhote saudável, com documentação em ordem e mentoria pós-venda direta com a criadora.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {DIFFERENTIALS.map(({ emoji, title, body }) => (
                <div key={title}>
                  <div className="group flex h-full gap-3 sm:gap-4 rounded-2xl border border-zinc-100 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md">
                    <div
                      className="mt-0.5 flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg sm:text-xl transition-all duration-300 group-hover:bg-emerald-100 group-hover:scale-110"
                      aria-hidden="true"
                    >
                      {emoji}
                    </div>
                    {/* <dl> e não <div>: dt/dd só são válidos dentro de uma lista
                        de descrição. O preflight do Tailwind zera a margem de <dl>
                        igual à de <div>, então o render é idêntico. */}
                    <dl>
                      <dt className="text-sm font-bold text-zinc-900 sm:text-base">{title}</dt>
                      <dd className="mt-1 text-xs sm:text-sm leading-relaxed text-zinc-600">{body}</dd>
                    </dl>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. AI MATCHMAKER ────────────────────────────────────────────────── */}
        <div className="home-deferred-section bg-[var(--bg)]">
          <ClientOnlyAiMatchmakerChat />
        </div>

        {/* ── 7. PROVA SOCIAL ─────────────────────────────────────────────────── */}
        <div className="home-deferred-section bg-white overflow-hidden">
          <div>
            <ClientOnlyTextTestimonials />
          </div>
          <div className="border-t border-zinc-100 pb-4">
            <ClientOnlyTestimonials title="Álbum das famílias" />
          </div>
        </div>

        {/* ── 8. TRANSPARÊNCIA DE PREÇO ───────────────────────────────────────── */}
        <div className="home-deferred-section bg-[var(--bg)]">
          <PriceTransparency />
        </div>

        {/* ── 9. ALERTA DE NINHADA ────────────────────────────────────────────── */}
        <div className="home-deferred-section bg-[var(--bg)] px-4 py-16 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <NinhadaAlert />
          </div>
        </div>

        {/* ── 10. FAQ — SEO semântico, voice search, AI overviews ─────────────── */}
        <div className="home-deferred-section">
          <HomeFAQ />
        </div>

        {/* ── 10.5. RECURSOS SOBRE A RAÇA — PageRank distribution ─────────── */}
        <div className="home-deferred-section">
          <section className="bg-zinc-50 border-t border-zinc-100 py-14 sm:py-20" aria-labelledby="recursos-heading">
            <div className="mx-auto max-w-5xl px-5 sm:px-8">
              <div className="mb-8 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Tudo sobre a raça</p>
                <h2 id="recursos-heading" className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  Guias e recursos para novos tutores
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Conteúdo escrito por quem cria a raça desde {FOUNDING_YEAR} — para você tomar a melhor decisão.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {RACE_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="text-2xl" aria-hidden="true">{l.emoji}</span>
                    <span className="mt-3 text-sm font-bold text-zinc-900 leading-snug group-hover:text-emerald-700">{l.label}</span>
                    <span className="mt-1.5 text-xs text-zinc-500 leading-snug">{l.desc}</span>
                    <span className="mt-4 text-xs font-semibold text-emerald-700">Ler mais →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ── 11. CTA DE GUIAS ────────────────────────────────────────────────── */}
        <div className="home-deferred-section border-t border-zinc-200 bg-white py-14">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">Conteúdo educativo</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Prepare-se para receber seu filhote
            </h2>
            <p className="mt-3 text-zinc-600">
              Guias escritos por quem cria desde {FOUNDING_YEAR}: alimentação, cuidados, documentação e muito mais.
            </p>
            <Link
              href="/guias"
              className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 px-7 py-3 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700 hover:scale-[1.02]"
            >
              Ver todos os guias →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
