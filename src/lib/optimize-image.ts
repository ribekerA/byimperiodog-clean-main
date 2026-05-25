/**
 * Otimiza URLs de imagens do Supabase Storage convertendo GIFs para WebP
 * e aplicando resize/qualidade adequados.
 * 
 * Supabase Image Transformation API:
 * https://supabase.com/docs/guides/storage/image-transformations
 */

export function optimizeSupabaseImage(url: string | undefined | null, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'origin';
  resize?: 'cover' | 'contain' | 'fill';
} = {}): string | undefined {
  if (!url) return undefined;
  
  // Se não for URL do Supabase, retornar original
  if (!url.includes('supabase.co/storage')) return url;
  
  const {
    width = 800,
    height,
    quality = 80,
    format = 'webp',
    resize = 'cover'
  } = options;
  
  try {
    const urlObj = new URL(url);
    
    // Adicionar parâmetros de transformação
    const params = new URLSearchParams();
    
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    if (quality) params.set('quality', quality.toString());
    if (format && format !== 'origin') params.set('format', format);
    if (resize) params.set('resize', resize);
    
    // Construir nova URL com transformações
    const transformParams = params.toString();
    if (!transformParams) return url;
    
    // Se já tem query params, adicionar com &, senão com ?
    const separator = urlObj.search ? '&' : '?';
    return `${url}${separator}${transformParams}`;
  } catch {
    // Se falhar o parse, retornar original
    return url;
  }
}

/**
 * Otimização específica para card de filhote (thumbnail)
 */
export function optimizePuppyCardImage(url: string | undefined | null): string | undefined {
  return optimizeSupabaseImage(url, {
    width: 640, // Mobile-first, suficiente para cards
    quality: 85,
    format: 'webp',
    resize: 'cover'
  });
}

/**
 * Otimização para galeria de detalhes
 */
export function optimizePuppyGalleryImage(url: string | undefined | null): string | undefined {
  return optimizeSupabaseImage(url, {
    width: 1200, // Maior para modal/detalhes
    quality: 90,
    format: 'webp',
    resize: 'cover'
  });
}

/**
 * Otimização para thumbnails pequenos (stories, previews)
 */
export function optimizePuppyThumb(url: string | undefined | null): string | undefined {
  return optimizeSupabaseImage(url, {
    width: 160, // 80px @ 2x DPR
    height: 160,
    quality: 75,
    format: 'webp',
    resize: 'cover'
  });
}
