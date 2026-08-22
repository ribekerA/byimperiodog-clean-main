"use client";

import { useState } from "react";

type Props = {
  images: string[];
  puppyName: string;
  puppyColor: string;
  puppySex: string;
  puppyId: string;
};

export default function PuppyGallery({ images, puppyName, puppyColor, puppySex }: Props) {
  const photos = images.filter((img) => !img.endsWith(".mp4"));
  const videos = images.filter((img) => img.endsWith(".mp4"));
  const [selected, setSelected] = useState(photos[0] ?? null);
  const [showVideo, setShowVideo] = useState(false);

  const alt = `${puppyName} — Spitz Alemão Anão ${puppyColor} ${puppySex}`;

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-24">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-100 shadow-sm">
        {selected && !showVideo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected} alt={alt} className="h-full w-full object-cover transition duration-300" />
        )}
        {showVideo && videos[0] && (
          <video src={videos[0]} controls autoPlay className="h-full w-full object-cover" aria-label={`Vídeo de ${puppyName}`} />
        )}
        {photos.length > 1 && !showVideo && (
          <p className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {(selected ? photos.indexOf(selected) : 0) + 1} / {photos.length}
          </p>
        )}
      </div>

      {(photos.length > 1 || videos.length > 0) && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {photos.slice(0, 11).map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => { setSelected(img); setShowVideo(false); }}
              className={`aspect-square overflow-hidden rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${selected === img && !showVideo ? "opacity-100 ring-2 ring-emerald-500 ring-offset-1" : "opacity-55 hover:opacity-100"}`}
              aria-label={`Ver foto ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" aria-hidden="true" />
            </button>
          ))}
          {videos.length > 0 && (
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className={`aspect-square overflow-hidden rounded-lg bg-zinc-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${showVideo ? "ring-2 ring-emerald-500 ring-offset-1" : "opacity-55 hover:opacity-100"}`}
              aria-label="Ver vídeo do filhote"
            >
              <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M6 3.5l7 4.5-7 4.5V3.5z" />
                </svg>
                <span className="text-[9px] font-bold uppercase tracking-wide text-white/70">Vídeo</span>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
