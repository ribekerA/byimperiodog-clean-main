/**
 * PuppyGallery v2.0 - Design System Refactor
 * Galeria de imagens/vídeos do filhote
 * UX: Navegação clara, preview em miniaturas
 * A11y: Navegação por teclado, labels descritivos, status de seleção
 * Performance: Lazy loading para miniaturas
 * 
 * Migrado para usar componentes do Design System:
 * - Button para controles de navegação (customizado com icon-only)
 */

"use client";

import { ChevronLeft, ChevronRight, Video } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui";

type Props = {
  images: string[];
  name: string;
};

export function PuppyGallery({ images, name }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-10 text-center" aria-label="Galeria de fotos">
        <p className="text-sm text-zinc-500">Nenhuma foto disponível</p>
      </section>
    );
  }

  const currentMedia = images[activeIndex];
  const isVideoFile = isVideo(currentMedia);

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="space-y-4" aria-label="Galeria de fotos e vídeos do filhote">
      {/* Imagem/vídeo principal */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-lg">
        {isVideoFile ? (
          <video
            key={currentMedia}
            className="h-full w-full object-cover"
            controls
            aria-label={`Vídeo ${activeIndex + 1} de ${images.length} - ${name}`}
          >
            <source src={currentMedia} />
            <track kind="captions" />
            Seu navegador não suporta vídeo.
          </video>
        ) : (
          <Image
            src={currentMedia}
            alt={`Foto ${activeIndex + 1} de ${images.length} do filhote ${name}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
            priority
          />
        )}

        {/* Controles de navegação (apenas se houver mais de uma mídia) */}
        {images.length > 1 && (
          <>
            <Button
              onClick={goToPrevious}
              variant="outline"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg backdrop-blur-sm hover:bg-white hover:scale-110"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </Button>
            <Button
              onClick={goToNext}
              variant="outline"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg backdrop-blur-sm hover:bg-white hover:scale-110"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </Button>

            {/* Contador */}
            <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2" role="tablist" aria-label="Miniaturas da galeria">
          {images.map((item, index) => {
            const isActive = index === activeIndex;
            const isVid = isVideo(item);

            return (
              <button
                key={`${item}-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={isVid ? `Selecionar vídeo ${index + 1}` : `Selecionar foto ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                  isActive
                    ? "border-emerald-600 ring-2 ring-emerald-600/40 shadow-md"
                    : "border-zinc-300 hover:border-zinc-400"
                }`}
              >
                {isVid ? (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white">
                    <Video className="h-6 w-6" aria-hidden="true" />
                  </div>
                ) : (
                  <Image src={item} alt="" fill className="object-cover" sizes="96px" />
                )}
                <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {isVid ? "Vídeo" : "Foto"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
}
