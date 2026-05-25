"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import passthroughImageLoader from "@/lib/passthrough-image-loader";
import { BLUR_DATA_URL } from "@/lib/placeholders";

export type StorySlide = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
};

export type Story = {
  id: string;
  title: string;
  slides: StorySlide[];
};

interface StoriesViewerProps {
  stories: Story[];
  open: boolean;
  initialIndex: number;
  onOpenChange: (open: boolean) => void;
}

export function StoriesViewer({ stories, open, initialIndex, onOpenChange }: StoriesViewerProps) {
  const totalStories = stories.length;
  const safeInitial = useMemo(() => {
    if (totalStories === 0) return 0;
    return initialIndex % totalStories;
  }, [initialIndex, totalStories]);

  const [index, setIndex] = useState(safeInitial);

  useEffect(() => {
    if (open) setIndex(safeInitial);
  }, [open, safeInitial]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" && totalStories > 1) {
        event.preventDefault();
        setIndex((prev) => (prev + 1) % totalStories);
      }
      if (event.key === "ArrowLeft" && totalStories > 1) {
        event.preventDefault();
        setIndex((prev) => (prev - 1 + totalStories) % totalStories);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, totalStories]);

  const story = stories[index];
  const slide = story?.slides?.[0];
  const hasMultiple = totalStories > 1;

  const next = () => {
    if (!hasMultiple) return;
    setIndex((prev) => (prev + 1) % totalStories);
  };

  const prev = () => {
    if (!hasMultiple) return;
    setIndex((prev) => (prev - 1 + totalStories) % totalStories);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9998] bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-[9999] flex flex-col items-center justify-center px-4 py-10 outline-none sm:px-8",
          )}
        >
          <Dialog.Title className="sr-only">
            {story ? `Story de ${story.title}` : "Stories dos filhotes"}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            {totalStories > 0 ? `Story ${index + 1} de ${totalStories}` : "Nenhum story disponÃ­vel"}
          </Dialog.Description>

          <Dialog.Close
            aria-label="Fechar stories"
            className="fixed right-4 top-4 z-[10000] inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-xl font-semibold text-white shadow-lg transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black md:right-6 md:top-6"
          >
            Ã—
          </Dialog.Close>

          <div className="flex w-full max-w-[min(90vw,520px)] flex-col items-center gap-6 text-white">
            <div className="flex w-full items-center justify-between text-xs uppercase tracking-[0.3em] text-zinc-200">
              <button
                type="button"
                onClick={prev}
                disabled={!hasMultiple}
                className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-black/40 px-3 text-xs transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Story anterior"
              >
                Anterior
              </button>
              <span className="pointer-events-none text-zinc-100">
                {totalStories > 0 ? `${index + 1} de ${totalStories}` : "0 de 0"}
              </span>
              <button
                type="button"
                onClick={next}
                disabled={!hasMultiple}
                className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-black/40 px-3 text-xs transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="PrÃ³ximo story"
              >
                PrÃ³ximo
              </button>
            </div>

            <div className="relative flex aspect-[9/16] w-full max-h-[75vh] items-center justify-center overflow-hidden rounded-3xl bg-black/60 shadow-2xl">
              {slide ? (
                <Image
                  loader={passthroughImageLoader}
                  src={slide.imageUrl}
                  alt={slide.description ?? slide.title}
                  fill
                  className="object-contain"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  decoding="async"
                  draggable={false}
                  sizes="(max-width: 768px) 90vw, 520px"
                  priority
                />
              ) : (
                <span className="text-sm text-zinc-300">Imagem indisponÃ­vel</span>
              )}
            </div>

            <div className="w-full text-center">
              <h2 className="text-lg font-semibold">{story?.title}</h2>
              {slide?.description ? <p className="mt-1 text-sm text-zinc-200">{slide.description}</p> : null}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default StoriesViewer;



