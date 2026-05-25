/**
 * Image Pipeline Configuration
 * Configurações globais para processamento de imagens de filhotes
 */

export const IMAGE_CONFIG = {
  /**
   * Tamanhos de saída padronizados
   */
  sizes: {
    hero: {
      width: 1200,
      height: 1200,
      quality: 85,
      format: 'webp' as const,
    },
    card: {
      width: 600,
      height: 600,
      quality: 80,
      format: 'webp' as const,
    },
    thumbnail: {
      width: 300,
      height: 300,
      quality: 75,
      format: 'webp' as const,
    },
  },

  /**
   * Ajustes de imagem automáticos
   */
  adjustments: {
    brightness: 1.05, // +5% de brilho
    saturation: 1.1, // +10% de saturação
    contrast: 1.02, // +2% de contraste
    sharpness: 1.2, // Leve sharpening
  },

  /**
   * Configurações de conversão
   */
  conversion: {
    webp: {
      quality: 80,
      effort: 6, // 0-6, maior = melhor compressão, mais lento
      nearLossless: false,
    },
    jpeg: {
      quality: 85,
      progressive: true,
      mozjpeg: true,
    },
  },

  /**
   * Crop inteligente
   */
  crop: {
    strategy: 'attention' as const, // 'attention' | 'entropy' | 'centre'
    position: 'centre' as const,
  },

  /**
   * Thresholds de qualidade
   */
  quality: {
    minWidth: 500,
    minHeight: 500,
    maxFileSize: 500 * 1024, // 500KB
    blurThreshold: 100, // Laplacian variance threshold
    exposureMin: 30, // Brightness min
    exposureMax: 225, // Brightness max
  },

  /**
   * Pastas de entrada/saída
   */
  paths: {
    input: 'raw-images',
    output: 'public/puppies',
    temp: '.tmp/images',
  },

  /**
   * Supabase Storage (opcional)
   */
  supabase: {
    enabled: process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined,
    bucket: 'puppy-images',
    cdnUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/puppy-images`
      : '',
  },

  /**
   * Naming pattern
   * {slug}-{color}-{sex}-{uuid}.{ext}
   */
  naming: {
    pattern: '{slug}-{color}-{sex}-{uuid}',
    sanitize: true,
    lowercase: true,
  },
} as const;

export type ImageSize = keyof typeof IMAGE_CONFIG.sizes;
export type ImageFormat = 'webp' | 'jpeg' | 'jpg';
