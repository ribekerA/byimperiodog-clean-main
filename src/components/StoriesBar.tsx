"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import passthroughImageLoader from "@/lib/passthrough-image-loader";
import { BLUR_DATA_URL } from "@/lib/placeholders";

import { StoriesViewer, type Story } from "./StoriesViewer";

export type { Story } from "./StoriesViewer";

interface StoriesBarProps {
  stories: Story[];
  className?: string;
  ariaLabel?: string;
  onStoryOpen?: (story: Story, index: number) => void;
}

export default function StoriesBar({ stories, className, ariaLabel = "Stories dos filhotes", onStoryOpen }: StoriesBarProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const thumbnails = useMemo(
    () =>
      stories.map((story) => {
        const cover = story.slides?.[0];
        return { id: story.id, title: story.title, cover };
      }),
    [stories],
  );

  if (!stories.length) return null;

  return (
    <>
      <div
        className={cn(
          "flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 pt-2 -mx-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-300 hover:scrollbar-thumb-zinc-400",
          className,
        )}
        role="region"
        aria-label={ariaLabel}
      >
        {thumbnails.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setCurrentIndex(index);
              onStoryOpen?.(stories[index], index);
              setOpen(true);
            }}
            className="group flex min-h-[104px] min-w-[96px] shrink-0 snap-start flex-col items-center gap-2 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            aria-label={`Abrir story de ${item.title}`}
          >
            <span className="relative aspect-square h-20 w-20 overflow-hidden rounded-3xl border-2 border-emerald-400 border-dashed transition group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-emerald-500 group-focus-visible:ring-offset-2">
              {item.cover?.imageUrl ? (
                <Image
                  loader={passthroughImageLoader}
                  src={item.cover.imageUrl}
                  alt={item.cover.description ?? item.title}
                  fill
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  sizes="80px"
                  priority={index < 4}
                />
              ) : (
                <span className="grid h-full w-full place-items-center bg-zinc-100 text-xs text-zinc-400">Sem foto</span>
              )}
            </span>
            <span className="max-w-[5.5rem] truncate text-center text-xs font-medium text-zinc-600 transition group-hover:text-emerald-600">
              {item.title}
            </span>
          </button>
        ))}
      </div>

      <StoriesViewer stories={stories} open={open} initialIndex={currentIndex} onOpenChange={setOpen} />
    </>
  );
}




