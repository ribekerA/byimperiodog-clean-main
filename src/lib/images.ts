/**
 * Image Helper
 * Funções auxiliares para obter URLs de imagens otimizadas
 */

import { IMAGE_CONFIG } from "../../scripts/image-pipeline/config";

export interface PuppyImageSet {
  hero: {
    src: string;
    width: number;
    height: number;
    srcSet?: string;
  };
  card: {
    src: string;
    width: number;
    height: number;
    srcSet?: string;
  };
  thumbnail: {
    src: string;
    width: number;
    height: number;
    srcSet?: string;
  };
}

export interface ImageSource {
  webp: string;
  jpeg: string;
  width: number;
  height: number;
}

/**
 * Retorna conjunto completo de imagens otimizadas para um filhote
 */
export function getPuppyImages(slug: string): PuppyImageSet {
  const baseUrl = `/puppies/${slug}`;

  return {
    hero: {
      src: `${baseUrl}/hero.webp`,
      width: IMAGE_CONFIG.sizes.hero.width,
      height: IMAGE_CONFIG.sizes.hero.height,
      srcSet: buildSrcSet(baseUrl, 'hero'),
    },
    card: {
      src: `${baseUrl}/card.webp`,
      width: IMAGE_CONFIG.sizes.card.width,
      height: IMAGE_CONFIG.sizes.card.height,
      srcSet: buildSrcSet(baseUrl, 'card'),
    },
    thumbnail: {
      src: `${baseUrl}/thumbnail.webp`,
      width: IMAGE_CONFIG.sizes.thumbnail.width,
      height: IMAGE_CONFIG.sizes.thumbnail.height,
      srcSet: buildSrcSet(baseUrl, 'thumbnail'),
    },
  };
}

/**
 * Retorna URL de imagem para um tamanho específico
 */
export function getPuppyImage(
  slug: string,
  size: 'hero' | 'card' | 'thumbnail' = 'card',
  format: 'webp' | 'jpeg' = 'webp'
): ImageSource {
  const ext = format === 'webp' ? 'webp' : 'jpg';
  const baseUrl = `/puppies/${slug}`;
  const sizeConfig = IMAGE_CONFIG.sizes[size];

  return {
    webp: `${baseUrl}/${size}.webp`,
    jpeg: `${baseUrl}/${size}.jpg`,
    width: sizeConfig.width,
    height: sizeConfig.height,
  };
}

/**
 * Constrói srcSet para responsive images
 */
function buildSrcSet(baseUrl: string, size: string): string {
  return `${baseUrl}/${size}.webp 1x, ${baseUrl}/${size}.webp 2x`;
}

/**
 * Retorna props otimizadas para next/image
 */
export function getNextImageProps(
  slug: string,
  size: 'hero' | 'card' | 'thumbnail' = 'card',
  options?: {
    priority?: boolean;
    loading?: 'lazy' | 'eager';
    quality?: number;
  }
) {
  const sizeConfig = IMAGE_CONFIG.sizes[size];
  const image = getPuppyImage(slug, size);

  return {
    src: image.webp,
    width: image.width,
    height: image.height,
    alt: '', // Deve ser fornecido pelo componente
    loading: options?.loading || (options?.priority ? 'eager' : 'lazy'),
    priority: options?.priority || false,
    quality: options?.quality || sizeConfig.quality,
    sizes: getSizesForImageSize(size),
  };
}

/**
 * Retorna string sizes para next/image baseado no tamanho
 */
function getSizesForImageSize(size: 'hero' | 'card' | 'thumbnail'): string {
  switch (size) {
    case 'hero':
      return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 1200px';
    case 'card':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px';
    case 'thumbnail':
      return '300px';
    default:
      return '100vw';
  }
}

/**
 * Retorna URL de fallback caso imagem otimizada não exista
 */
export function getPuppyImageWithFallback(
  slug: string,
  fallbackUrl?: string
): ImageSource {
  const image = getPuppyImage(slug, 'card');

  // TODO: Implementar verificação de existência
  // Por enquanto, retorna a URL otimizada

  return image;
}

/**
 * Valida se as imagens otimizadas existem para um slug
 */
export async function validatePuppyImages(slug: string): Promise<boolean> {
  // TODO: Implementar verificação no filesystem ou Supabase
  // Por enquanto, assume que existem
  return true;
}

/**
 * Retorna URL do Supabase CDN se configurado
 */
export function getSupabaseImageUrl(
  puppyId: string,
  size: 'hero' | 'card' | 'thumbnail' = 'card',
  format: 'webp' | 'jpeg' = 'webp'
): string {
  if (!IMAGE_CONFIG.supabase.enabled || !IMAGE_CONFIG.supabase.cdnUrl) {
    return '';
  }

  const ext = format === 'webp' ? 'webp' : 'jpg';
  return `${IMAGE_CONFIG.supabase.cdnUrl}/${puppyId}/${size}.${ext}`;
}

/**
 * Retorna props completas para <picture> com fallback
 */
export interface PictureProps {
  sources: Array<{
    srcSet: string;
    type: string;
  }>;
  img: {
    src: string;
    width: number;
    height: number;
    alt: string;
    loading: 'lazy' | 'eager';
  };
}

export function getPictureProps(
  slug: string,
  alt: string,
  size: 'hero' | 'card' | 'thumbnail' = 'card',
  priority = false
): PictureProps {
  const image = getPuppyImage(slug, size);

  return {
    sources: [
      {
        srcSet: image.webp,
        type: 'image/webp',
      },
      {
        srcSet: image.jpeg,
        type: 'image/jpeg',
      },
    ],
    img: {
      src: image.jpeg, // Fallback
      width: image.width,
      height: image.height,
      alt,
      loading: priority ? 'eager' : 'lazy',
    },
  };
}
