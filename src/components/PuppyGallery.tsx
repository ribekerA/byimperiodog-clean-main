"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";

import { BLUR_DATA_URL } from "@/lib/placeholders";
import track from "@/lib/track";

export type Slide = { type: "image" | "video"; url: string };

function guess(u: string): "image" | "video" {
  return /\.(mp4|webm|mov)$/i.test(u) ? "video" : "image";
}

export default function PuppyGallery({
  slides,
  images,
  alt = "Filhote Spitz Alemão Anão",
  puppyId,
}: {
  slides?: Slide[];
  images?: string[];
  alt?: string;
  puppyId?: string;
}) {
  const list: Slide[] = useMemo(() => slides ?? (images || []).map((u) => ({ type: guess(u), url: u })), [slides, images]);
  const [i, setI] = useState(0);

  useEffect(() => setI(0), [list]);

  if (!list.length) {
    return <div className="aspect-[4/3] w-full rounded-2xl bg-zinc-100 ring-1 ring-black/5" />;
  }

  const prev = () => setI((v) => (v - 1 + list.length) % list.length);
  const next = () => {
    const n = (i + 1) % list.length;
    setI(n);
    if (puppyId) track.event?.("gallery_swipe", { puppy_id: puppyId, index: n });
  };

  const s = list[i];

  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/5">
      <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-1 text-xs font-semibold text-white">
        {i + 1}/{list.length}
      </div>

      {s.type === "video" ? (
        <video controls className="aspect-[4/3] w-full object-cover" src={s.url}>
          <track kind="captions" />
        </video>
      ) : (
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={s.url}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            loading="lazy"
            draggable={false}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            decoding="async"
          />
        </div>
      )}

      {list.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow ring-1 ring-black/10 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow ring-1 ring-black/10 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Próxima"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}

