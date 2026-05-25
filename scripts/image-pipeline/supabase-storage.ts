/**
 * Supabase Storage Integration
 * Upload automático de imagens processadas para Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { IMAGE_CONFIG } from './config';
import type { ProcessedImage } from './processor';

const supabase = IMAGE_CONFIG.supabase.enabled
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : null;

export interface UploadResult {
  success: boolean;
  url?: string;
  cdnUrl?: string;
  error?: string;
}

/**
 * Upload de imagem processada para Supabase Storage
 */
export async function uploadToSupabase(
  image: ProcessedImage,
  puppyId: string
): Promise<UploadResult> {
  if (!supabase || !IMAGE_CONFIG.supabase.enabled) {
    return {
      success: false,
      error: 'Supabase não configurado',
    };
  }

  try {
    // 1. Ler arquivo
    const filePath = path.join(process.cwd(), image.path);
    const fileBuffer = await fs.readFile(filePath);

    // 2. Gerar path no bucket
    // Padrão: {puppyId}/{size}.{format}
    const storagePath = `${puppyId}/${image.size}.${image.format === 'webp' ? 'webp' : 'jpg'}`;

    // 3. Upload
    const { data, error } = await supabase.storage
      .from(IMAGE_CONFIG.supabase.bucket)
      .upload(storagePath, fileBuffer, {
        contentType: image.format === 'webp' ? 'image/webp' : 'image/jpeg',
        upsert: true, // Sobrescreve se já existir
        cacheControl: '31536000', // 1 ano
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // 4. Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from(IMAGE_CONFIG.supabase.bucket)
      .getPublicUrl(storagePath);

    return {
      success: true,
      url: data.path,
      cdnUrl: publicUrlData.publicUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Upload em lote de todas as imagens processadas
 */
export async function uploadBatchToSupabase(
  images: ProcessedImage[],
  puppyId: string
): Promise<Map<string, UploadResult>> {
  const results = new Map<string, UploadResult>();

  for (const image of images) {
    const key = `${image.size}-${image.format}`;
    const result = await uploadToSupabase(image, puppyId);
    results.set(key, result);
  }

  return results;
}

/**
 * Remove imagens antigas de um filhote no Supabase
 */
export async function deleteSupabaseImages(puppyId: string): Promise<void> {
  if (!supabase || !IMAGE_CONFIG.supabase.enabled) {
    return;
  }

  try {
    // Lista todos os arquivos do filhote
    const { data: files, error: listError } = await supabase.storage
      .from(IMAGE_CONFIG.supabase.bucket)
      .list(puppyId);

    if (listError || !files || files.length === 0) {
      return;
    }

    // Remove todos
    const filePaths = files.map((f) => `${puppyId}/${f.name}`);
    await supabase.storage.from(IMAGE_CONFIG.supabase.bucket).remove(filePaths);

    console.log(`   🗑️  Removidas ${files.length} imagens do Supabase`);
  } catch (error) {
    console.warn('   ⚠️  Erro ao remover imagens do Supabase:', error);
  }
}

/**
 * Verifica se o Supabase está configurado e acessível
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabase || !IMAGE_CONFIG.supabase.enabled) {
    return false;
  }

  try {
    // Tenta listar o bucket
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.warn('⚠️  Erro ao conectar com Supabase:', error.message);
      return false;
    }

    const bucket = data?.find((b) => b.name === IMAGE_CONFIG.supabase.bucket);
    
    if (!bucket) {
      console.warn(`⚠️  Bucket '${IMAGE_CONFIG.supabase.bucket}' não encontrado`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('⚠️  Erro ao verificar conexão Supabase:', error);
    return false;
  }
}
