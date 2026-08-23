import type { Variants } from 'framer-motion';

export const fadeInUp:Variants = {
  hidden:{ opacity:0, y:12 },
  show:{ opacity:1, y:0, transition:{ duration:0.4, ease:'easeOut' } }
};
export const scaleIn:Variants = {
  hidden:{ opacity:0, scale:0.96 },
  show:{ opacity:1, scale:1, transition:{ duration:0.25 } }
};
export const stagger = (staggerChildren=0.06):Variants => ({
  hidden:{ opacity:0 },
  show:{ opacity:1, transition:{ staggerChildren } }
});

/** Utility helpers for consistent micro-interactions */
export const micro = {
  hoverScale: 1.01,
  hoverY: 2, // px translate
  easing: {
    standard: 'cubic-bezier(.4,.0,.2,1)',
    exit: 'cubic-bezier(.4,0,.2,1)',
    enter: 'cubic-bezier(.4,0,.2,1)'
  }
};

/** Parallax layers config (lightweight, transform only) */
export const parallaxLayers = [
  { depth: 0.15 },
  { depth: 0.3 },
  { depth: 0.45 }
];

export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export function applyParallax(selector: string, strength = 20) {
  if (prefersReducedMotion()) return;
  const root = document.querySelector(selector);
  if (!root) return;
  const layers = Array.from(root.querySelectorAll('[data-parallax-layer]')) as HTMLElement[];
  const handle = () => {
    const scrollY = window.scrollY;
    layers.forEach((el) => {
      const d = Number(el.dataset.parallaxLayer || '0');
      const offset = (scrollY * d * strength) / 100;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
  };
  window.addEventListener('scroll', handle, { passive: true });
  handle();
}
