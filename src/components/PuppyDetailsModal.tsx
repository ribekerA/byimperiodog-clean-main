"use client";

import { Camera, MapPin, PawPrint, ShieldCheck, Sparkles, Video, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { Modal } from "@/components/dashboard/Modal";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type Props = {
  puppy: any;
  onClose: () => void;
};

export default function PuppyDetailsModal({ puppy: rawPuppy, onClose }: Props) {
  const puppy = useMemo(() => normalize(rawPuppy), [rawPuppy]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const mediaItems = useMemo(() => puppy?.images ?? [], [puppy]);

  const waLink = useMemo(() => {
    if (!puppy) return "#";
    return buildWhatsAppLink({
      message: `Olá! Vi o filhote ${puppy.name} (${puppy.color}, ${translateSex(puppy.sex)}) e quero detalhes sobre disponibilidade e valor.`,
      utmSource: "site",
      utmMedium: "modal",
      utmCampaign: "puppy_detail",
      utmContent: puppy.slug || puppy.id,
    });
  }, [puppy]);

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={puppy?.name ?? "Detalhes do filhote"}
      description={puppy?.status ? `Status: ${translateStatus(puppy.status)}` : undefined}
      size="lg"
    >
      {puppy && (
        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-8">
          <div className="space-y-4">
            <figure className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)] bg-zinc-50 lg:max-h-[520px]">
              {mediaItems[activeMediaIndex] ? (
                isVideo(mediaItems[activeMediaIndex]) ? (
                  <video
                    className="h-full w-full object-cover"
                    controls
                    aria-label={`Vídeo do filhote ${puppy.name}`}
                    poster={mediaItems.find((m) => !isVideo(m))}
                  >
                    <source src={mediaItems[activeMediaIndex]} />
                  </video>
                ) : (
                  <Image
                    src={mediaItems[activeMediaIndex]}
                    alt={`Filhote ${puppy.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 640px"
                    priority
                  />
                )
              ) : (
                <div className="grid h-full place-items-center text-sm text-zinc-500">Sem imagem</div>
              )}
            </figure>

            {mediaItems.length > 1 && (
              <div className="flex gap-3 overflow-auto pb-2" aria-label="Galeria de fotos e vídeos do filhote">
                {mediaItems.map((item, index) => {
                  const isActive = index === activeMediaIndex;
                  return (
                    <button
                      key={`${item}-${index}`}
                      type="button"
                      onClick={() => setActiveMediaIndex(index)}
                      className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 ${
                        isActive ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/40" : "border-[var(--border)]"
                      }`}
                      aria-label={isVideo(item) ? `Selecionar vídeo ${index + 1}` : `Selecionar imagem ${index + 1}`}
                      aria-pressed={isActive}
                    >
                      {isVideo(item) ? (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-[var(--brand-foreground)]">
                          <Video className="h-5 w-5" aria-hidden="true" />
                        </div>
                      ) : (
                        <Image src={item} alt="" fill className="object-cover" sizes="96px" />
                      )}
                      <span className="absolute bottom-1 right-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
                        {isVideo(item) ? "Vídeo" : "Foto"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {puppy.description && (
              <div className="rounded-lg border border-[var(--border)] bg-white/70 p-4">
                <h3 className="mb-2 text-base font-semibold text-[var(--text)]">Sobre esse filhote</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">{puppy.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text)] shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--text)]">Ficha rápida</h3>
                {puppy.status && (
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {translateStatus(puppy.status)}
                  </span>
                )}
              </div>
              <dl className="mt-3 space-y-3 text-[var(--text-muted)]">
                {puppy.priceCents != null && (
                  <div className="flex items-center justify-between">
                    <dt className="font-medium text-[var(--text)]">Investimento</dt>
                    <dd className="text-[var(--text)]">{fmtPrice(puppy.priceCents)}</dd>
                  </div>
                )}
                {puppy.color && (
                  <div className="flex items-center justify-between">
                    <dt>Cor</dt>
                    <dd className="text-[var(--text)]">{puppy.color}</dd>
                  </div>
                )}
                {puppy.sex && (
                  <div className="flex items-center justify-between">
                    <dt>Sexo</dt>
                    <dd className="text-[var(--text)]">{translateSex(puppy.sex)}</dd>
                  </div>
                )}
                {puppy.birthDate && (
                  <div className="flex items-center justify-between">
                    <dt>Nascimento</dt>
                    <dd className="text-[var(--text)]">
                      {new Date(puppy.birthDate).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                )}
                {(puppy.city || puppy.state) && (
                  <div className="flex items-center gap-2 text-[var(--text)]">
                    <MapPin className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
                    <span>
                      {puppy.city ?? ""} {puppy.state ? `/ ${puppy.state}` : ""}
                    </span>
                  </div>
                )}
                {puppy.averageRating && (
                  <div className="flex items-center gap-2">
                    <PawPrint className="h-4 w-4 text-amber-500" aria-hidden="true" />
                    <span className="text-[var(--text)]">
                      {puppy.averageRating.toFixed(1)} ({puppy.reviewCount ?? 0} avaliações)
                    </span>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-white/80 p-4 text-sm text-[var(--text)] shadow-sm">
              <h3 className="text-base font-semibold text-[var(--text)]">O que você recebe</h3>
              <ul className="mt-3 space-y-2 text-[var(--text-muted)]">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
                  Certificado digital, carteira de vacinação e orientação pós-venda.
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
                  Socialização guiada e acompanhamento na adaptação.
                </li>
                <li className="flex items-start gap-2">
                  <Camera className="mt-0.5 h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
                  Chamadas de vídeo para ver o filhote antes de decidir.
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-[var(--brand-foreground)] shadow-sm transition hover:bg-[var(--brand)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
              >
                <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                Falar no WhatsApp
              </a>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function fmtPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

function translateSex(sex?: string | null) {
  if (!sex) return "Sexo não informado";
  if (sex.toLowerCase() === "male") return "Macho";
  if (sex.toLowerCase() === "female") return "Fêmea";
  return sex;
}

function translateStatus(status?: string | null) {
  if (!status) return "Disponível";
  if (status.toLowerCase() === "reservado") return "Reservado";
  if (status.toLowerCase() === "vendido") return "Vendido";
  return "Disponível";
}

function normalize(p: any) {
  // Suporta campos em português e inglês
  const name = p.nome || p.name || "Filhote";
  const color = p.cor || p.color || "Creme";
  const genderValue = p.sexo || p.gender || p.sex;
  const sex = genderValue === "femea" || genderValue === "female" ? "female" : "male";

  // Preço: converte de decimal para centavos se necessário
  let priceCents = p.price_cents ?? p.priceCents ?? 0;
  if (p.preco && !p.price_cents && !p.priceCents) {
    const precoDecimal = parseFloat(p.preco);
    priceCents = Math.round(precoDecimal * 100);
  }

  const midiaArray = p.midia || p.images || [];
  const images = Array.isArray(midiaArray)
    ? midiaArray
        .filter((item: any) => item && (typeof item === "string" || item.url))
        .map((item: any) => (typeof item === "string" ? item : item.url))
        .filter((u: string) => u.startsWith("/") || /^https?:\/\//.test(u))
    : [];

  return {
    id: p.id,
    slug: p.slug,
    name,
    description: p.descricao || p.description || "",
    priceCents,
    color,
    sex,
    birthDate: p.nascimento || p.birth_date || p.birthDate,
    images,
    city: p.city,
    state: p.state,
    status: p.status,
    // Campos obrigatórios de Puppy preenchidos com valores padrão se ausentes
    breed: p.breed || "Spitz Alemão Anão",
    size: p.size || "mini",
    title: p.title || name,
    currency: p.currency || "BRL",
    isHighlighted: p.isHighlighted ?? false,
    isFeatured: p.isFeatured ?? false,
    isBestSeller: p.isBestSeller ?? false,
    isNewArrival: p.isNewArrival ?? false,
    seoKeywords: p.seoKeywords || [],
    hasPedigree: p.hasPedigree ?? true,
    vaccinationStatus: p.vaccinationStatus || "up-to-date",
    hasMicrochip: p.hasMicrochip ?? false,
    reviewCount: p.reviewCount ?? 0,
    averageRating: p.averageRating ?? 0,
    viewCount: p.viewCount ?? 0,
    favoriteCount: p.favoriteCount ?? 0,
    shareCount: p.shareCount ?? 0,
    inquiryCount: p.inquiryCount ?? 0,
    source: p.source || "own-breeding",
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
  };
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg)$/i.test(url);
}
