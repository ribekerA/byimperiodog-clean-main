/**
 * ============================================================================
 * Helper: Responsive Image Sizes
 * Objetivo: Gerar strings `sizes` otimizadas para next/image
 * ============================================================================
 */

/**
 * Breakpoints padrão (Tailwind)
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/**
 * Sizes para imagem HERO (otimizado para LCP <2.5s)
 * - Mobile (≤640px): 640px image (22KB)
 * - Tablet (641-1024px): 1024px image (53KB)
 * - Desktop (>1024px): 1400px image (109KB)
 */
/**
 * Sizes para imagem HERO (grid 1.1fr/1fr em desktop)
 * - Mobile (≤640px): 100vw (imagem ~640px)
 * - Tablet (641-1024px): ~48vw (coluna principal)
 * - Desktop (>1024px): largura fixa ~560px
 */
export const HERO_IMAGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 48vw, 560px";

/**
 * Sizes para grid de filhotes (1 col mobile, 2 tablet, 3 desktop)
 */
export const PUPPY_CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

/**
 * Sizes para Stories (círculos fixos ~80px)
 */
export const STORY_AVATAR_SIZES = "80px";

/**
 * Sizes para Blog Card (1 col mobile, 2 tablet, 3 desktop)
 */
export const BLOG_CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

/**
 * Sizes para imagem de capa do Blog Post (full-width)
 */
export const BLOG_POST_COVER_SIZES = "100vw";

/**
 * Sizes para thumbnails pequenos (quadrados ~64px)
 */
export const THUMBNAIL_SIZES = "64px";

/**
 * Sizes para modal/lightbox (90vw em mobile, 80vw desktop)
 */
export const MODAL_IMAGE_SIZES = "(max-width: 768px) 90vw, 80vw";

/**
 * Helper genérico: criar sizes baseado em colunas por breakpoint
 * 
 * @example
 * generateSizes({ sm: 1, md: 2, lg: 3 })
 * // "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
 */
export function generateSizes(columns: {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  "2xl"?: number;
}): string {
  const sizes: string[] = [];
  
  if (columns.sm) {
    sizes.push(`(max-width: ${BREAKPOINTS.sm}px) ${Math.floor(100 / columns.sm)}vw`);
  }
  if (columns.md) {
    sizes.push(`(max-width: ${BREAKPOINTS.md}px) ${Math.floor(100 / columns.md)}vw`);
  }
  if (columns.lg) {
    sizes.push(`(max-width: ${BREAKPOINTS.lg}px) ${Math.floor(100 / columns.lg)}vw`);
  }
  if (columns.xl) {
    sizes.push(`(max-width: ${BREAKPOINTS.xl}px) ${Math.floor(100 / columns.xl)}vw`);
  }
  
  // Fallback: usar última coluna definida ou 100vw
  const lastCol = columns["2xl"] || columns.xl || columns.lg || columns.md || columns.sm || 1;
  sizes.push(`${Math.floor(100 / lastCol)}vw`);
  
  return sizes.join(", ");
}

/**
 * Helper: Calcular width/height ideais baseado em aspect ratio
 */
export function getAspectDimensions(
  aspectRatio: "1/1" | "4/3" | "16/9" | "3/4",
  baseWidth: number
): { width: number; height: number } {
  const ratios = {
    "1/1": 1,
    "4/3": 4 / 3,
    "16/9": 16 / 9,
    "3/4": 3 / 4,
  };
  
  const ratio = ratios[aspectRatio];
  return {
    width: baseWidth,
    height: Math.round(baseWidth / ratio),
  };
}

/**
 * Helper: Preload de imagem crítica (LCP)
 * Usar em <head> para imagens hero
 */
export function generatePreloadLink(
  href: string,
  type: "image/avif" | "image/webp" | "image/jpeg" = "image/avif"
): string {
  return `<link rel="preload" as="image" href="${href}" type="${type}" fetchpriority="high" />`;
}
