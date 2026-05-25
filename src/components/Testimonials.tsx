"use client";

import Image from 'next/image';
import Script from 'next/script';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { BLUR_DATA_URL } from '@/lib/placeholders';

import CLIENT_PHOTOS from './clientPhotos';

type Variant = 'carousel' | 'grid';

interface TestimonialsProps {
  title?: string;
  photos?: string[];
  autoplayDelay?: number;
  fit?: 'cover' | 'contain';
  bgPattern?: boolean;
  cities?: string[];
  jsonLd?: boolean;
  debug?: boolean;
  variant?: Variant;
  showCount?: number; // usado no grid
  navigationStyle?: 'dots' | 'counter' | 'progress'; // estilo de navegação
}

  const DEFAULT_CITY_POOL = [
  'Bragança Paulista','Atibaia','Itatiba','Valinhos','Vinhedo','Campinas','Indaiatuba','Jundiaí','Louveira','Barueri - Alphaville','Santana de Parnaíba','São Paulo - Jardins','São Paulo - Vila Olímpia','São Paulo - Morumbi','Holambra','Jaguariúna','Joanópolis','Socorro','Morungaba','Extrema (MG)'
];

export default function Testimonials({
  title = 'Clientes',
  photos,
  autoplayDelay = 3500,
  fit = 'contain',
  bgPattern = false,
  cities,
  jsonLd = false,
  debug = false,
  variant = 'carousel',
  showCount = 6,
  navigationStyle = 'progress'
}: TestimonialsProps) {
  // Detectar preferência por movimento reduzido (CSS já trata via motion-reduce:*)
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const list = photos?.length ? photos : CLIENT_PHOTOS.slice();
  const CITY_POOL = cities?.length ? cities : DEFAULT_CITY_POOL;
  const total = list.length;
  const [index, setIndex] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const current = useMemo(() => list[index % total], [index, list, total]);
  const city = CITY_POOL[index % CITY_POOL.length];

  const altFor = useCallback((p: string, i: number) => {
    const base = p.split('/').pop() || '';
    const c = CITY_POOL[i % CITY_POOL.length];
    if (/^cliente/i.test(base)) return `Cliente By Império Dog em ${c}`;
    return `Spitz Alemão - Cliente By Império Dog em ${c}`;
  }, [CITY_POOL]);

  // autoplay avançado com pausa em hover/focus
  useEffect(() => {
    if (variant !== 'carousel') return;
    if (reduceMotion || isPaused || total < 2) return;
    timerRef.current && clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIndex(i => (i + 1) % total), autoplayDelay);
    return () => { timerRef.current && clearTimeout(timerRef.current); };
  }, [autoplayDelay, reduceMotion, isPaused, total, index, variant]);

  const goTo = useCallback((i: number) => setIndex(((i % total) + total) % total), [total]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // JSON-LD simples (mesmo placeholder anterior)
  const reviewsLd = jsonLd ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'By Império Dog',
    review: list.slice(0, 12).map(() => ({
      '@type': 'Review',
      reviewBody: 'Cliente verificado',
      author: { '@type': 'Person', name: 'Cliente verificado' }
    }))
  } : null;
  // Prefetch próxima imagem para transição suave (sempre declara hook antes de early return)
  useEffect(() => {
    if (!total || variant !== 'carousel') return;
    const nextIdx = (index + 1) % total;
    const nextSrc = list[nextIdx];
    if (!nextSrc) return;
    const img = new window.Image();
    img.src = nextSrc;
  }, [index, list, total, variant]);

  if (!total) return null;

  return (
    <section aria-label={title} className="relative py-16">
      {reviewsLd ? <Script id="ld-reviews" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsLd) }} /> : null}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">{title}</h2>
            {variant === 'carousel' && <p className="mt-1 text-sm text-[var(--text-muted)]">Histórias reais de famílias e seus Spitz.</p>}
          </div>
          {variant === 'carousel' && total > 1 && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={prev} aria-label="Anterior" className="btn-outline inline-flex h-12 min-w-12 items-center justify-center px-3 text-sm">←</button>
              <button type="button" onClick={next} aria-label="Próximo" className="btn-outline inline-flex h-12 min-w-12 items-center justify-center px-3 text-sm">→</button>
            </div>
          )}
        </header>

        {variant === 'grid' && (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {list.slice(0, showCount).map((p, i) => (
              <li key={p} className={cn('relative aspect-square overflow-hidden rounded-xl ring-1 ring-[var(--border)] bg-[var(--surface)]')}> 
                <Image
                  src={p}
                  alt={altFor(p, i)}
                  fill
                  className={cn('object-cover', fit === 'contain' && 'object-contain p-1')}
                  sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 15vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  unoptimized
                />
              </li>
            ))}
          </ul>
        )}

        {variant === 'carousel' && (
          <div
            className="group relative"
            role="group"
            aria-roledescription="carrossel"
            aria-label="Depoimentos de clientes"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onTouchStart={(e) => {
              if (e.touches.length !== 1) return;
              touchStartX.current = e.touches[0].clientX;
              touchDeltaX.current = 0;
              setPaused(true);
            }}
            onTouchMove={(e) => {
              if (touchStartX.current == null) return;
              touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
            }}
            onTouchEnd={() => {
              if (touchStartX.current == null) return;
              const delta = touchDeltaX.current;
              const threshold = 40; // px
              if (Math.abs(delta) > threshold) {
                if (delta < 0) next(); else prev();
              }
              touchStartX.current = null;
              touchDeltaX.current = 0;
              setPaused(false);
            }}
          >
            <div className={cn(
              'relative mx-auto w-full max-w-[640px] aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-[var(--border)] bg-[var(--surface)] flex items-center justify-center shadow-sm',
              bgPattern && '[background:repeating-linear-gradient(45deg,rgba(16,185,129,0.07)_0_6px,transparent_6px_12px)]'
            )}>
              {current && (
                <figure
                  key={current}
                  className="relative w-full h-full opacity-0 scale-[1.02] animate-fade-in motion-reduce:opacity-100 motion-reduce:scale-100 motion-reduce:animate-none"
                >
                  <Image
                    src={current}
                    alt={altFor(current, index)}
                    fill
                    className={cn('will-change-transform', fit === 'contain' ? 'object-contain p-2' : 'object-cover')}
                    sizes="(max-width: 768px) 90vw, (max-width: 1280px) 50vw, 640px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                  <figcaption className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/55 text-white text-[11px] px-2 py-1 backdrop-blur-sm shadow-sm">
                    {city}
                  </figcaption>
                </figure>
              )}
              {total > 1 && (
                <>
                  <button 
                    type="button" 
                    aria-label="Foto anterior" 
                    onClick={prev} 
                    className={cn(
                      'focus-visible:focus-ring absolute left-2 top-1/2 -translate-y-1/2',
                      'rounded-full bg-black/60 text-white p-3 backdrop-blur-sm',
                      'transition-opacity shadow-lg',
                      'opacity-100 md:opacity-0 md:group-hover:opacity-100',
                      'hover:bg-black/75 active:scale-95'
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    type="button" 
                    aria-label="Próxima foto" 
                    onClick={next} 
                    className={cn(
                      'focus-visible:focus-ring absolute right-2 top-1/2 -translate-y-1/2',
                      'rounded-full bg-black/60 text-white p-3 backdrop-blur-sm',
                      'transition-opacity shadow-lg',
                      'opacity-100 md:opacity-0 md:group-hover:opacity-100',
                      'hover:bg-black/75 active:scale-95'
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            {total > 1 && navigationStyle === 'progress' && (
              <div className="mt-4 space-y-3" aria-label="Navegação do carrossel">
                {/* Progress Bar */}
                <div 
                  className="relative w-full max-w-md mx-auto h-1.5 bg-[var(--border)] rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={index + 1}
                  aria-valuemin={1}
                  aria-valuemax={total}
                  aria-label={`Foto ${index + 1} de ${total}`}
                >
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-300 ease-out"
                    style={{ width: `${((index + 1) / total) * 100}%` }}
                  />
                </div>
                {/* Counter + Navigation Buttons */}
                  <div className="flex items-center justify-center gap-4">
                    <button 
                      type="button"
                      onClick={prev} 
                      aria-label="Foto anterior"
                      className="btn-outline h-10 px-4 text-sm font-medium hover:bg-emerald-50 transition-colors"
                    >
                      ← Anterior
                    </button>
                  <span className="text-sm font-medium text-[var(--text)] min-w-[4rem] text-center">
                    {index + 1} de {total}
                  </span>
                    <button 
                      type="button"
                      onClick={next} 
                      aria-label="Próxima foto"
                      className="btn-outline h-10 px-4 text-sm font-medium hover:bg-emerald-50 transition-colors"
                    >
                      Próxima →
                    </button>
                </div>
              </div>
            )}
            {total > 1 && navigationStyle === 'counter' && (
              <div className="mt-4 flex items-center justify-center gap-4" aria-label="Navegação do carrossel">
                <button 
                  type="button"
                  onClick={prev} 
                  aria-label="Foto anterior"
                  className="btn-outline h-12 px-5 text-sm font-medium"
                >
                    ← Anterior
                </button>
                <span className="text-base font-semibold text-[var(--text)] min-w-[5rem] text-center">
                  {index + 1} / {total}
                </span>
                <button 
                  type="button"
                  onClick={next} 
                  aria-label="Próxima foto"
                  className="btn-outline h-12 px-5 text-sm font-medium"
                >
                    Próxima →
                </button>
              </div>
            )}
            {total > 1 && navigationStyle === 'dots' && (
              <div className="mt-4 flex justify-center gap-2 flex-wrap max-w-2xl mx-auto" aria-label="Seleção de foto">
                {list.slice(0, 10).map((p, i) => {
                  const active = i === (index % total);
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-label={`Mostrar foto ${i + 1}`}
                      aria-pressed={active}
                      onClick={() => goTo(i)}
                      className={cn(
                        'min-h-[44px] min-w-[44px] rounded-full transition-all flex items-center justify-center',
                        active ? 'bg-emerald-500' : 'bg-[var(--border)] hover:bg-emerald-400/70'
                      )}
                    >
                      <span className={cn('rounded-full transition-all', active ? 'h-4 w-8 bg-white' : 'h-3 w-3 bg-current')} aria-hidden="true" />
                    </button>
                  );
                })}
                {total > 10 && (
                  <span className="flex items-center text-sm text-[var(--text-muted)] px-2">
                    +{total - 10} fotos
                  </span>
                )}
              </div>
            )}
            {debug && (
              <pre className="mt-4 text-xs text-[var(--text-muted)]">index: {index} paused: {String(isPaused)}</pre>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

