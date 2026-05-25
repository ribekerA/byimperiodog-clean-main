/**
 * CLI para processar imagens de filhotes
 * Uso: npm run images:process
 */

import fs from 'fs/promises';
import path from 'path';
import { analyzeImageQuality, formatQualityReport } from './quality-analyzer';
import { processImage, cleanupOldImages } from './processor';
import { IMAGE_CONFIG } from './config';

interface ImageFile {
  path: string;
  slug: string;
  color?: string;
  sex?: 'male' | 'female';
}

async function main() {
  console.log('🎨 Pipeline de Processamento de Imagens - By Império Dog\n');

  // 1. Verificar pasta de entrada
  const inputDir = IMAGE_CONFIG.paths.input;
  const inputPath = path.join(process.cwd(), inputDir);

  try {
    await fs.access(inputPath);
  } catch {
    console.error(`❌ Pasta de entrada não encontrada: ${inputPath}`);
    console.log('\n💡 Dica: Crie a pasta e organize as imagens assim:');
    console.log('   raw-images/');
    console.log('     spitz-branco-macho/');
    console.log('       foto1.jpg');
    console.log('       foto2.jpg');
    console.log('     lulu-laranja-femea/');
    console.log('       foto1.jpg\n');
    process.exit(1);
  }

  // 2. Escanear pastas e imagens
  console.log('📂 Escaneando imagens...\n');
  const imageFiles = await scanImageFolders(inputPath);

  if (imageFiles.length === 0) {
    console.log('⚠️  Nenhuma imagem encontrada em:', inputDir);
    process.exit(0);
  }

  console.log(`   Encontradas: ${imageFiles.length} imagens\n`);

  // 3. Processar cada imagem
  let processedCount = 0;
  let errorCount = 0;

  for (const imageFile of imageFiles) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📸 Processando: ${imageFile.slug}`);
    console.log(`${'='.repeat(60)}`);

    try {
      // 3.1. Análise de qualidade
      console.log('\n1️⃣  Analisando qualidade...');
      const qualityReport = await analyzeImageQuality(imageFile.path);
      console.log(formatQualityReport(qualityReport));

      if (!qualityReport.passed) {
        console.log('\n⚠️  Imagem com problemas de qualidade. Prosseguindo mesmo assim...');
      }

      // 3.2. Limpar imagens antigas
      console.log('\n2️⃣  Limpando imagens antigas...');
      await cleanupOldImages(imageFile.slug);

      // 3.3. Processar imagem
      console.log('\n3️⃣  Processando tamanhos...');
      const result = await processImage(imageFile.path, {
        slug: imageFile.slug,
        color: imageFile.color,
        sex: imageFile.sex,
      });

      if (result.success) {
        console.log(`\n✅ Sucesso! ${result.images.length} imagens geradas:`);
        
        // Agrupar por tamanho
        const bySize = result.images.reduce((acc, img) => {
          if (!acc[img.size]) acc[img.size] = [];
          acc[img.size].push(img);
          return acc;
        }, {} as Record<string, typeof result.images>);

        for (const [size, imgs] of Object.entries(bySize)) {
          const webp = imgs.find((i) => i.format === 'webp');
          const jpeg = imgs.find((i) => i.format === 'jpeg');
          
          if (webp && jpeg) {
            const webpKB = (webp.fileSize / 1024).toFixed(1);
            const jpegKB = (jpeg.fileSize / 1024).toFixed(1);
            console.log(`   📦 ${size}: ${webpKB}KB (WebP) + ${jpegKB}KB (JPEG)`);
          }
        }

        processedCount++;
      } else {
        console.error('\n❌ Erros:', result.errors.join(', '));
        errorCount++;
      }
    } catch (error) {
      console.error('\n❌ Erro fatal:', error);
      errorCount++;
    }
  }

  // 4. Resumo final
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESUMO FINAL');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Processadas com sucesso: ${processedCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📁 Pasta de saída: ${IMAGE_CONFIG.paths.output}\n`);

  if (processedCount > 0) {
    console.log('💡 Próximos passos:');
    console.log('   1. Verifique as imagens em: public/puppies/');
    console.log('   2. Use o helper getPuppyImage() para obter URLs otimizadas');
    console.log('   3. Integre com o admin para upload automático\n');
  }
}

/**
 * Escaneia pastas de imagens e extrai metadados do nome
 */
async function scanImageFolders(inputDir: string): Promise<ImageFile[]> {
  const imageFiles: ImageFile[] = [];

  const folders = await fs.readdir(inputDir, { withFileTypes: true });

  for (const folder of folders) {
    if (!folder.isDirectory()) continue;

    const folderPath = path.join(inputDir, folder.name);
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        continue;
      }

      const filePath = path.join(folderPath, file);

      // Extrair metadados do nome da pasta
      // Padrão: spitz-branco-macho ou lulu-laranja-femea
      const parts = folder.name.split('-');
      const slug = parts[0]; // spitz, lulu, etc
      const color = parts[1]; // branco, laranja
      const sexStr = parts[2]; // macho, femea
      const sex: 'male' | 'female' | undefined =
        sexStr === 'macho'
          ? 'male'
          : sexStr === 'femea' || sexStr === 'fêmea'
            ? 'female'
            : undefined;

      imageFiles.push({
        path: filePath,
        slug: folder.name, // usa o nome completo da pasta como slug
        color,
        sex,
      });
    }
  }

  return imageFiles;
}

// Executar CLI
main().catch((error) => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
});
