import Image from "next/image";
import Link from "next/link";

import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type PuppyPreview = {
  id: string;
  slug?: string;
  name: string;
  color: string;
  sex: string;
  status: string;
  priceCents: number;
  images: string[];
  description?: string;
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  available: { label: "Disponível", className: "bg-emerald-100 text-emerald-800" },
  reserved: { label: "Reservado", className: "bg-amber-100 text-amber-800" },
  sold: { label: "Vendido", className: "bg-rose-100 text-rose-800" },
};

const SEX_LABEL: Record<string, string> = {
  female: "Fêmea",
  male: "Macho",
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

type Props = {
  puppies: PuppyPreview[];
};

export default function FeaturedPuppies({ puppies }: Props) {
  const featured = puppies.slice(0, 4);

  return (
    <section className="bg-white py-20 sm:py-28" aria-labelledby="featured-heading">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Filhotes disponíveis
          </span>
          <h2
            id="featured-heading"
            className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
          >
            Conheça nossos Spitz Alemão Anão
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600">
            Criados com socialização guiada, alimentação premium e acompanhamento veterinário.
            Cada filhote entregue com registro oficial e laudos em mãos.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((puppy) => {
            const cover = puppy.images.find((img) => !img.endsWith(".mp4")) ?? puppy.images[0];
            const statusConfig = STATUS_LABEL[puppy.status] ?? STATUS_LABEL.available;
            const sexLabel = SEX_LABEL[puppy.sex] ?? puppy.sex;
            const whatsappLink = buildWhatsAppLink({
              message: `Olá! Vi o ${puppy.name} (${puppy.color} ${sexLabel}) no site e gostaria de mais informações.`,
              utmSource: "site",
              utmMedium: "featured_card",
              utmCampaign: "filhotes",
              utmContent: puppy.id,
            });

            return (
              <article
                key={puppy.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
                  {cover && !cover.endsWith(".mp4") && (
                    <Image
                      src={cover}
                      alt={`${puppy.name} — Spitz Alemão Anão ${puppy.color} ${sexLabel}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  )}
                  {/* Status badge */}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${statusConfig.className}`}
                    aria-label={`Status: ${statusConfig.label}`}
                  >
                    {statusConfig.label}
                  </span>
                  {/* Sex badge */}
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur-sm">
                    {sexLabel}
                  </span>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{puppy.color}</p>
                    <h3 className="text-base font-bold text-zinc-900">{puppy.name}</h3>
                  </div>

                  {puppy.description && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600">{puppy.description}</p>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xl font-bold text-zinc-900">{formatPrice(puppy.priceCents)}</span>
                  </div>

                  {/* CTA */}
                  {puppy.status !== "sold" && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                      <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                      Tenho interesse
                    </a>
                  )}
                  {puppy.slug && (
                    <Link
                      href={`/filhotes/${puppy.slug}`}
                      className="mt-1 inline-flex w-full items-center justify-center gap-1 text-xs font-medium text-zinc-500 transition hover:text-emerald-700 hover:underline"
                    >
                      Ver página do filhote →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA footer */}
        <div className="mt-12 text-center">
          <Link
            href="/filhotes"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-full border-2 border-emerald-600 px-8 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Ver todos os filhotes disponíveis →
          </Link>
        </div>
      </div>
    </section>
  );
}
