/**
 * Admin Image Upload Integration
 * Integração do pipeline de imagens com o sistema de upload do admin
 */

import { analyzePuppyImage, type PuppyImageAIResult } from '@/lib/ai/puppyImageQualityAI';
import { analyzePuppyVision, type PuppyVisionInsights } from '@/lib/ai/puppyVisionAI';

import { processImage, type ProcessedImage } from '../../scripts/image-pipeline/processor';
import { analyzeImageQuality } from '../../scripts/image-pipeline/quality-analyzer';
import { uploadBatchToSupabase } from '../../scripts/image-pipeline/supabase-storage';

export interface UploadImageOptions {
  puppyId: string;
  slug: string;
  color?: string;
  sex?: 'male' | 'female';
  useSupabase?: boolean;
}

export interface UploadImageResult {
  success: boolean;
  images: ProcessedImage[];
  urls: {
    hero?: string;
    card?: string;
    thumbnail?: string;
  };
  errors: string[];
  quality?: {
    passed: boolean;
    issues: Array<{
      severity: 'error' | 'warning' | 'info';
      message: string;
    }>;
    ai?: PuppyImageAIResult;
    vision?: PuppyVisionInsights;
  };
}

/**
 * Processa e faz upload de uma imagem de filhote
 * Uso no admin após upload de arquivo
 */
export async function uploadPuppyImage(
  file: File | string,
  options: UploadImageOptions
): Promise<UploadImageResult> {
  const errors: string[] = [];
  let filePath: string;

  try {
    // 1. Converter File para caminho temporário se necessário
    if (typeof file === 'string') {
      filePath = file;
    } else {
      // Salvar File em pasta temporária
      filePath = await saveTemporaryFile(file);
    }

    // 2. Analisar qualidade
    console.log('📊 Analisando qualidade da imagem...');
    const qualityReport = await analyzeImageQuality(filePath);
    const aiQuality = await analyzePuppyImage(filePath, {
      puppyName: options.slug,
    });
    const visionInsights = await analyzePuppyVision(filePath, {
      puppyName: options.slug,
      cardTitle: `Qualidade • ${options.slug}`,
      colorHint: options.color,
      sexHint: options.sex === 'male' ? 'macho' : options.sex === 'female' ? 'femea' : undefined,
    });

    if (!qualityReport.passed) {
      console.warn('⚠️  Imagem com problemas de qualidade:', qualityReport.issues);
    }

    if (aiQuality.issues.length) {
      console.warn('🤖  Aviso da PuppyImageQualityAI:', aiQuality);
    }

    // 3. Processar imagem
    console.log('🖼️  Processando imagem...');
    const processResult = await processImage(filePath, {
      slug: options.slug,
      color: options.color,
      sex: options.sex,
    });

    if (!processResult.success) {
      errors.push(...processResult.errors);
      return {
        success: false,
        images: [],
        urls: {},
        errors,
      };
    }

    // 4. Upload para Supabase (se habilitado)
    const urls: UploadImageResult['urls'] = {};

    if (options.useSupabase) {
      console.log('☁️  Fazendo upload para Supabase...');
      const uploadResults = await uploadBatchToSupabase(
        processResult.images,
        options.puppyId
      );

      // Extrair URLs por tamanho
      for (const [key, result] of uploadResults.entries()) {
        if (result.success && result.cdnUrl) {
          const [size] = key.split('-');
          urls[size as keyof typeof urls] = result.cdnUrl;
        }
      }
    } else {
      // URLs locais
      urls.hero = processResult.images.find(
        (i) => i.size === 'hero' && i.format === 'webp'
      )?.url;
      urls.card = processResult.images.find(
        (i) => i.size === 'card' && i.format === 'webp'
      )?.url;
      urls.thumbnail = processResult.images.find(
        (i) => i.size === 'thumbnail' && i.format === 'webp'
      )?.url;
    }

    // 5. Limpar arquivo temporário
    if (typeof file !== 'string') {
      await cleanupTemporaryFile(filePath);
    }

    return {
      success: true,
      images: processResult.images,
      urls,
      errors,
      quality: {
        passed: qualityReport.passed,
        issues: qualityReport.issues,
        ai: aiQuality,
        vision: visionInsights,
      },
    };
  } catch (error) {
    const message = `Erro ao processar upload: ${error instanceof Error ? error.message : 'Desconhecido'}`;
    errors.push(message);

    return {
      success: false,
      images: [],
      urls: {},
      errors,
    };
  }
}

/**
 * Salva File temporariamente para processamento
 */
async function saveTemporaryFile(file: File): Promise<string> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');

  const tempDir = path.join(os.tmpdir(), 'puppy-uploads');
  await fs.mkdir(tempDir, { recursive: true });

  const tempPath = path.join(tempDir, `${Date.now()}-${file.name}`);
  const buffer = await file.arrayBuffer();
  await fs.writeFile(tempPath, Buffer.from(buffer));

  return tempPath;
}

/**
 * Remove arquivo temporário
 */
async function cleanupTemporaryFile(filePath: string): Promise<void> {
  try {
    const fs = await import('fs/promises');
    await fs.unlink(filePath);
  } catch (error) {
    console.warn('⚠️  Erro ao limpar arquivo temporário:', error);
  }
}

/**
 * Exemplo de uso no componente de admin
 */
export const adminUploadExample = `
// No componente de admin (Server Action ou API Route)
import { uploadPuppyImage } from '@/lib/admin-upload';

async function handleUpload(formData: FormData) {
  const file = formData.get('image') as File;
  const puppyId = formData.get('puppyId') as string;
  const slug = formData.get('slug') as string;

  const result = await uploadPuppyImage(file, {
    puppyId,
    slug,
    color: 'branco',
    sex: 'male',
    useSupabase: true, // ou false para salvar localmente
  });

  if (!result.success) {
    return { error: result.errors.join(', ') };
  }

  // Salvar URLs no banco de dados
  await db.puppies.update(puppyId, {
    imageHero: result.urls.hero,
    imageCard: result.urls.card,
    imageThumbnail: result.urls.thumbnail,
  });

  return { success: true, urls: result.urls };
}
`;
