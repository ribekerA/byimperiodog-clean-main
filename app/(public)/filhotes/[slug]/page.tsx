import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PuppyCinematicGallery from "@/components/catalog/PuppyCinematicGallery";
import {
  ClientOnlyNotifyMeButton,
  ClientOnlyPuppyReviews,
  ClientOnlyPuppyStickyFloatingCTA,
} from "@/components/catalog/PuppyClientOnly";
import PuppyDetailPanel from "@/components/catalog/PuppyDetailPanel";
import LeadEventTracker from "@/components/LeadEventTracker";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { TiltCard } from "@/components/motion/TiltCard";
import { staticPuppies } from "@/content/puppies-static";
import { formatPrice, getPuppyBySlug } from "@/lib/catalog-utils";
import { focoDaFoto } from "@/lib/photo-focus";
import { OG_DEFAULT_IMAGE } from "@/lib/seo";
import { buildBreadcrumbLD, buildPuppyProductLD } from "@/lib/structured-data";
import { buildWhatsAppLink } from "@/lib/whatsapp";

// UrgencyCountdown, PuppyViewerCount e VisitorActivityToast foram removidos.
// Os tres exibiam atividade que nunca aconteceu:
//  • UrgencyCountdown derivava um "reservado em" por hash do slug e contava
//    24h para uma expiracao de reserva que nao existe em lugar nenhum.
//  • PuppyViewerCount caia numa "simulacao organica" de 3 a 12 pessoas vendo
//    agora sempre que o Realtime do Supabase nao respondia.
//  • VisitorActivityToast sorteava nome e cidade de listas fixas para anunciar
//    "Fulana de Campinas favoritou este filhote".
// Anuncio de escassez e de demanda so pode sair de dado real e verificavel.

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> };

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return staticPuppies.map((p) => ({ slug: p.slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const puppy = getPuppyBySlug(params.slug);
  if (!puppy) return { title: "Filhote não encontrado" };

  const sexLabel = puppy.sex === "female" ? "Fêmea" : "Macho";
  const corLabel = (puppy as any).cor ?? puppy.color ?? "";
  // O título repetia cor e sexo duas vezes ("Spitz Cinza-Lobo (Wolf Sable)
  // Fêmea — Spitz Alemão Anão (Lulu da Pomerânia) Cinza-Lobo Fêmea"): 109
  // caracteres com o sufixo da marca, cortado na busca e com a palavra "Spitz"
  // três vezes. O nome do filhote já traz cor e sexo; só falta o sinônimo pelo
  // qual a raça é mais pesquisada.
  // O sinônimo só entra quando cabe. "Spitz Cinza-Lobo (Wolf Sable) Fêmea —
  // Lulu da Pomerânia" dava 72 caracteres com o sufixo da marca, e o Google
  // cortava exatamente em cima do sinônimo — que era a única razão de ele
  // estar ali. Nos nomes curtos ele ajuda quem pesquisa por "Lulu"; nos longos
  // o próprio nome do filhote já diz cor, sexo e raça.
  const tituloCompleto = `${puppy.name} — Lulu da Pomerânia`;
  const title = tituloCompleto.length <= 45 ? tituloCompleto : puppy.name;
  const description =
    (puppy as any).description ??
    `Filhote de Spitz Alemão Anão (Lulu da Pomerânia) ${corLabel} ${sexLabel} em Bragança Paulista, SP. Registro oficial, consulta veterinária e mentoria pós-venda.`;
  const descricaoBusca = resumirParaBusca(description);
  const firstImage = puppy.images?.find((img: string) => !img.endsWith(".mp4"));

  // A rota /og/filhote/[slug] nunca chegou a devolver imagem: quebrava no
  // Satori ("Expected <div> to have explicit display: flex"), buscava a foto em
  // outro domínio e baixava fonte de emoji em tempo
  // de requisição. Estas 8 páginas ficavam sem og:image no WhatsApp. A foto do
  // próprio filhote é arquivo estático, sempre responde e compartilha melhor.
  // Sem width/height: a foto do filhote não é 1200×630, e declarar essa medida
  // fazia o WhatsApp recortar errado.
  const ogImages = firstImage ? [{ url: firstImage, alt: puppy.name }] : [OG_DEFAULT_IMAGE];

  return {
    title,
    description: descricaoBusca,
    alternates: { canonical: `/filhotes/${puppy.slug}` },
    openGraph: {
      title,
      description: descricaoBusca,
      type:   "website",
      url:    `/filhotes/${puppy.slug}`,
      images: ogImages,
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description: descricaoBusca,
      images:      ogImages,
    },
  };
}

/**
 * Encurta o texto do filhote para a busca sem cortar palavra pela metade.
 *
 * A meta description saía de description.slice(0, 160) e seis das nove fichas
 * terminavam assim: "...confirmar disponibilidade, documentação e cond".
 * O texto inteiro continua na página, dentro do PuppyHero — quem corta é só o
 * resumo que vai para o Google. Aqui ele fecha na última frase que couber, e
 * só recorre ao corte por palavra quando nem a primeira frase cabe.
 */
function resumirParaBusca(texto: string, limite = 158) {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;

  const cortado = limpo.slice(0, limite);
  const fimDeFrase = Math.max(
    cortado.lastIndexOf(". "),
    cortado.lastIndexOf("! "),
    cortado.lastIndexOf("? "),
  );
  if (fimDeFrase > limite / 2) return cortado.slice(0, fimDeFrase + 1);

  return cortado.slice(0, cortado.lastIndexOf(" ")).replace(/[,;:—-]$/, "") + "…";
}

// ─── Mapa de cor → glow (TiltCard dos relacionados) ──────────────────────────

const COLOR_GLOW: Record<string, string> = {
  creme:        "rgba(243,181,98,0.45)",
  laranja:      "rgba(249,115,22,0.40)",
  preto:        "rgba(161,161,170,0.30)",
  "wolf-sable": "rgba(99,102,241,0.35)",
  branco:       "rgba(255,255,255,0.30)",
};
const DEFAULT_GLOW = "rgba(52,211,153,0.30)";

const STATUS_LABEL: Record<string, string> = {
  available:  "Disponível",
  disponivel: "Disponível",
  reserved:   "Reservado",
  reservado:  "Reservado",
  sold:       "Vendido",
  vendido:    "Vendido",
};

// ─── Página ────────────────────────────────────────────────────────────────────

export default async function PuppyPage(props: Props) {
  const params = await props.params;
  const puppy = getPuppyBySlug(params.slug);
  if (!puppy) notFound();

  const sexLabel  = puppy.sex === "female" ? "Fêmea" : "Macho";
  const sexSlug   = puppy.sex === "female" ? "femea" : "macho";
  const corLabel  = (puppy as any).cor ?? puppy.color ?? "";
  const colorSlug = (puppy.color ?? (puppy as any).cor ?? "").toLowerCase();
  const description =
    (puppy as any).description ??
    `Filhote de Spitz Alemão Anão (Lulu da Pomerânia) ${corLabel} ${sexLabel} em Bragança Paulista, SP. Registro oficial, consulta veterinária e mentoria pós-venda.`;

  const status = ((puppy.status ?? "available") as string) as "available" | "reserved" | "sold";
  const isSold = status === "sold" || status === "vendido" as string;

  const waLink = buildWhatsAppLink({
    message: `Olá! Vi o filhote ${puppy.name} (${corLabel}, ${sexLabel}) no site e quero saber disponibilidade e condições.`,
    utmSource: "site",
    utmMedium: "puppy_page",
    utmCampaign: "filhote_detalhe",
    utmContent: puppy.slug,
  });

  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://byimperiodog.com.br").replace(/\/$/, "");

  const productLd    = buildPuppyProductLD(puppy as any);
  const breadcrumbLd = buildBreadcrumbLD([
    { name: "Início",    url: `${SITE_URL}/` },
    { name: "Filhotes",  url: `${SITE_URL}/filhotes` },
    { name: puppy.name,  url: `${SITE_URL}/filhotes/${puppy.slug}` },
  ]);

  const related = staticPuppies
    .filter((p) => p.slug !== puppy.slug && p.color === puppy.color && p.status !== "sold")
    .slice(0, 3);

  const availableOfSameColor = staticPuppies.filter(
    (p) => p.color === puppy.color && p.status !== "sold" && p.status !== "vendido"
  ).length;

  const coverImage = puppy.images?.find((img: string) => !img.endsWith(".mp4"));

  return (
    <>
      {/* JSON-LD */}
      <script id="ld-product"    type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script id="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {/* GA4: lead_filhote — disparado quando visitante visualiza a página do filhote */}
      <LeadEventTracker eventName="lead_filhote" params={{ puppy_slug: puppy.slug, puppy_color: colorSlug, puppy_sex: sexSlug }} />

      <div className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-10 lg:pb-16">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav aria-label="Navegação estrutural" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
            <li><Link href="/" className="hover:text-emerald-700 hover:underline">Início</Link></li>
            <li aria-hidden="true" className="text-zinc-300">/</li>
            <li><Link href="/filhotes" className="hover:text-emerald-700 hover:underline">Filhotes</Link></li>
            <li aria-hidden="true" className="text-zinc-300">/</li>
            <li className="font-medium text-zinc-900" aria-current="page">{puppy.name}</li>
          </ol>
        </nav>

        {/* ── Grid principal ─────────────────────────────────────────────── */}
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">

          {/* Galeria cinematográfica */}
          <PuppyCinematicGallery
            images={puppy.images ?? []}
            puppyName={puppy.name}
            puppyColor={corLabel}
            puppySex={sexLabel}
            puppyId={puppy.slug}
          />

          {/* Painel de detalhes */}
          {/* `min-w-0`: a coluna da galeria já tinha, esta não. Sem ela a
              trilha do grid cresce até o min-content do conteúdo mais rígido
              do painel, e qualquer texto que não quebre volta a estourar a
              largura da tela no celular. */}
          <div className="flex min-w-0 flex-col gap-4">
            <PuppyDetailPanel
              name={puppy.name}
              corLabel={corLabel}
              colorSlug={colorSlug}
              sexLabel={sexLabel}
              sexSlug={sexSlug}
              status={status}
              priceCents={(puppy as any).priceCents ?? (puppy as any).price_cents}
              description={description}
              availableOfSameColor={availableOfSameColor}
              waLink={waLink}
              slug={puppy.slug}
            />

            {/* Hooked loop: filhote vendido/reservado → usuário deixa WhatsApp para ser notificado */}
            {isSold && (
              <ClientOnlyNotifyMeButton color={colorSlug} colorLabel={corLabel} />
            )}
          </div>
        </div>

        {/* ── Avaliações das famílias ────────────────────────────────────── */}
        <ClientOnlyPuppyReviews puppySlug={puppy.slug} puppyName={puppy.name} />

        {/* ── Filhotes relacionados ──────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-14 sm:mt-20" aria-labelledby="related-heading">
            <ScrollReveal>
              <h2
                id="related-heading"
                className="mb-6 text-xl font-bold text-zinc-900"
              >
                Outros filhotes {corLabel} disponíveis
              </h2>
            </ScrollReveal>

            <StaggerContainer stagger={0.1} delay={0.05} margin="-40px">
              <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {related.map((rel) => {
                  const relSex    = rel.sex === "female" ? "Fêmea" : "Macho";
                  const relCor    = (rel as any).cor ?? rel.color ?? "";
                  const relCorKey = (rel.color ?? relCor).toLowerCase();
                  const relImg    = rel.images?.find((img: string) => !img.endsWith(".mp4"));
                  const relStatus = rel.status ?? "available";
                  const glowColor = COLOR_GLOW[relCorKey] ?? DEFAULT_GLOW;

                  return (
                    // O <li> vem POR FORA do StaggerItem, que renderiza uma
                    // <div>. Invertido, a <ul> passava a conter <div> direto e
                    // o <li> ficava dentro dela: o leitor de tela deixava de
                    // anunciar "lista de N itens" e o cascateamento continua
                    // igual, porque o framer-motion propaga variante por
                    // contexto de React, nao por vizinhanca no DOM.
                    <li key={rel.slug}>
                      <StaggerItem>
                        <TiltCard glowColor={glowColor} maxTilt={7}>
                          <Link
                            href={`/filhotes/${rel.slug}`}
                            className="group block overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-md"
                          >
                            <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
                              {relImg && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={relImg}
                                  alt={`Filhote ${rel.name}`}
                                  // Recorte medido por foto (src/lib/photo-focus):
                                  // aqui o quadro e quadrado e a foto e vertical, entao
                                  // sobra ainda menos margem para errar a ancora.
                                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                                  style={{ objectPosition: focoDaFoto(relImg) }}
                                  loading="lazy"
                                />
                              )}
                              <div
                                className="absolute inset-0"
                                style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.45) 100%)" }}
                                aria-hidden="true"
                              />
                              {/* right-3 + line-clamp: nomes longos como "Spitz
                                  Cinza-Lobo (Wolf Sable) Femea" saiam do card e
                                  eram cortados no meio da palavra pelo overflow. */}
                              <span className="absolute bottom-2 left-3 right-3 line-clamp-2 text-sm font-bold text-white drop-shadow">
                                {rel.name}
                              </span>
                            </div>
                            <div className="p-3">
                              <span className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                relStatus === "available" || relStatus === "disponivel"
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "bg-amber-50 text-amber-800"
                              }`}>
                                {STATUS_LABEL[relStatus] ?? "Disponível"}
                              </span>
                              <p className="mt-1 text-sm text-zinc-500">{relCor} · {relSex}</p>
                              {(rel as any).priceCents > 0 && (
                                <p className="mt-1 text-sm font-bold text-emerald-700">
                                  {formatPrice((rel as any).priceCents)}
                                </p>
                              )}
                            </div>
                          </Link>
                        </TiltCard>
                      </StaggerItem>
                    </li>
                  );
                })}
              </ul>
            </StaggerContainer>
          </section>
        )}

        {/* ── Voltar ────────────────────────────────────────────────────── */}
        <div className="mt-12 text-center">
          <Link
            href="/filhotes"
            className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-emerald-500 hover:text-emerald-700"
          >
            ← Ver todos os filhotes disponíveis
          </Link>
        </div>
      </div>

      {/* ── CTA flutuante (desktop card + mobile barra) ────────────────── */}
      <ClientOnlyPuppyStickyFloatingCTA
        name={puppy.name}
        coverImage={coverImage}
        priceCents={(puppy as any).priceCents ?? (puppy as any).price_cents}
        waLink={waLink}
        status={puppy.status ?? "available"}
      />
    </>
  );
}
