/**
 * Image Processor
 * Processa imagens de filhotes com resize, crop, ajustes e conversão
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { IMAGE_CONFIG, type ImageSize } from './config';

export interface ProcessOptions {
  slug: string;
  color?: string;
  sex?: 'male' | 'female';
  skipQualityCheck?: boolean;
}

export interface ProcessedImage {
  size: ImageSize;
  format: 'webp' | 'jpeg';
  path: string;
  url: string;
  width: number;
  height: number;
  fileSize: number;
}

export interface ProcessResult {
  success: boolean;
  images: ProcessedImage[];
  errors: string[];
}

/**
 * Processa uma imagem em todos os tamanhos configurados
 */
export async function processImage(
  inputPath: string,
  options: ProcessOptions
): Promise<ProcessResult> {
  const errors: string[] = [];
  const images: ProcessedImage[] = [];

  try {
    // 1. Carregar imagem original
    const originalImage = sharp(inputPath);
    const metadata = await originalImage.metadata();

    console.log(`\n🖼️  Processando: ${path.basename(inputPath)}`);
    console.log(`   Original: ${metadata.width}x${metadata.height}`);

    // 2. Criar pasta de saída
    const outputDir = path.join(
      IMAGE_CONFIG.paths.output,
      options.slug
    );
    await fs.mkdir(outputDir, { recursive: true });

    // 3. Processar cada tamanho
    for (const [sizeName, sizeConfig] of Object.entries(IMAGE_CONFIG.sizes)) {
      const size = sizeName as ImageSize;

      try {
        // 3.1. Processar WebP
        const webpResult = await processImageSize(
          originalImage,
          size,
          'webp',
          outputDir,
          options
        );
        images.push(webpResult);

        // 3.2. Processar JPEG fallback
        const jpegResult = await processImageSize(
          originalImage,
          size,
          'jpeg',
          outputDir,
          options
        );
        images.push(jpegResult);

        console.log(`   ✅ ${size}: ${webpResult.width}x${webpResult.height}`);
      } catch (error) {
        const message = `Erro ao processar tamanho ${size}: ${error instanceof Error ? error.message : 'Desconhecido'}`;
        errors.push(message);
        console.error(`   ❌ ${message}`);
      }
    }

    return {
      success: errors.length === 0,
      images,
      errors,
    };
  } catch (error) {
    const message = `Erro ao processar imagem: ${error instanceof Error ? error.message : 'Desconhecido'}`;
    errors.push(message);
    console.error(`   ❌ ${message}`);

    return {
      success: false,
      images,
      errors,
    };
  }
}

/**
 * Processa imagem para um tamanho e formato específico
 */
async function processImageSize(
  originalImage: sharp.Sharp,
  size: ImageSize,
  format: 'webp' | 'jpeg',
  outputDir: string,
  options: ProcessOptions
): Promise<ProcessedImage> {
  const sizeConfig = IMAGE_CONFIG.sizes[size];
  const uuid = uuidv4().split('-')[0]; // Primeiros 8 caracteres

  // 1. Gerar nome do arquivo
  const fileName = generateFileName(options, size, format, uuid);
  const outputPath = path.join(outputDir, fileName);

  // 2. Pipeline de processamento
  let pipeline = originalImage.clone();

  // 2.1. Resize com crop inteligente
  pipeline = pipeline.resize(sizeConfig.width, sizeConfig.height, {
    fit: 'cover',
    position: IMAGE_CONFIG.crop.strategy,
  });

  // 2.2. Ajustes de cor e exposição
  pipeline = pipeline
    .modulate({
      brightness: IMAGE_CONFIG.adjustments.brightness,
      saturation: IMAGE_CONFIG.adjustments.saturation,
    })
    .linear(IMAGE_CONFIG.adjustments.contrast, 0);

  // 2.3. Sharpening leve
  pipeline = pipeline.sharpen({
    sigma: IMAGE_CONFIG.adjustments.sharpness,
  });

  // 2.4. Conversão de formato
  if (format === 'webp') {
    pipeline = pipeline.webp({
      quality: IMAGE_CONFIG.conversion.webp.quality,
      effort: IMAGE_CONFIG.conversion.webp.effort,
      nearLossless: IMAGE_CONFIG.conversion.webp.nearLossless,
    });
  } else {
    pipeline = pipeline.jpeg({
      quality: IMAGE_CONFIG.conversion.jpeg.quality,
      progressive: IMAGE_CONFIG.conversion.jpeg.progressive,
      mozjpeg: IMAGE_CONFIG.conversion.jpeg.mozjpeg,
    });
  }

  // 3. Salvar
  await pipeline.toFile(outputPath);

  // 4. Obter informações do arquivo salvo
  const stats = await fs.stat(outputPath);
  const relativePath = path.relative(process.cwd(), outputPath);

  return {
    size,
    format,
    path: relativePath,
    url: `/puppies/${options.slug}/${fileName}`,
    width: sizeConfig.width,
    height: sizeConfig.height,
    fileSize: stats.size,
  };
}

/**
 * Gera nome de arquivo padronizado
 * Padrão: {slug}-{color}-{sex}-{size}-{uuid}.{ext}
 */
function generateFileName(
  options: ProcessOptions,
  size: ImageSize,
  format: 'webp' | 'jpeg',
  uuid: string
): string {
  const parts: string[] = [options.slug];

  if (options.color) {
    parts.push(sanitizeString(options.color));
  }

  if (options.sex) {
    parts.push(options.sex);
  }

  parts.push(size);
  parts.push(uuid);

  const name = parts.join('-');
  const ext = format === 'webp' ? 'webp' : 'jpg';

  return `${name}.${ext}`;
}

/**
 * Sanitiza string para uso em nome de arquivo
 */
function sanitizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui não-alfanuméricos por hífen
    .replace(/^-+|-+$/g, ''); // Remove hífens do início/fim
}

/**
 * Processa múltiplas imagens em lote
 */
export async function processBatch(
  inputPaths: string[],
  options: ProcessOptions
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];

  for (const inputPath of inputPaths) {
    const result = await processImage(inputPath, options);
    results.push(result);
  }

  return results;
}

/**
 * Remove imagens antigas de um slug
 */
export async function cleanupOldImages(slug: string): Promise<void> {
  const outputDir = path.join(IMAGE_CONFIG.paths.output, slug);

  try {
    await fs.rm(outputDir, { recursive: true, force: true });
    console.log(`   🗑️  Limpeza: ${outputDir}`);
  } catch (error) {
    console.warn(`   ⚠️  Erro ao limpar ${outputDir}:`, error);
  }
}
