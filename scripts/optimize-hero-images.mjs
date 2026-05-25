#!/usr/bin/env node
/**
 * Script de otimização das imagens hero para LCP < 2.5s
 * 
 * PROBLEMA: spitz-hero-desktop.webp tem 2MB → LCP 11.6s
 * META: Mobile ≤100KB, Desktop ≤200KB → LCP <2.5s
 * 
 * Uso: node scripts/optimize-hero-images.mjs
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

const sourceImage = join(publicDir, 'spitz-hero-desktop-original.webp');

// Verificar se arquivo fonte existe
if (!existsSync(sourceImage)) {
  console.error(`❌ Imagem fonte não encontrada: ${sourceImage}`);
  process.exit(1);
}

console.log('🖼️  Otimizando imagens hero para LCP...\n');

const optimizations = [
  {
    name: 'spitz-hero-mobile.webp',
    width: 640,
    quality: 80,
    targetSize: '~100KB',
    description: 'Mobile (até 640px)'
  },
  {
    name: 'spitz-hero-tablet.webp',
    width: 1024,
    quality: 82,
    targetSize: '~150KB',
    description: 'Tablet (640-1024px)'
  },
  {
    name: 'spitz-hero-desktop.webp',
    width: 1400,
    quality: 85,
    targetSize: '~200KB',
    description: 'Desktop (1024px+)'
  }
];

async function optimizeImage({ name, width, quality, targetSize, description }) {
  const outputPath = join(publicDir, name);
  
  try {
    const startTime = Date.now();
    
    await sharp(sourceImage)
      .resize(width, null, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ 
        quality,
        effort: 6 // 0-6, maior = melhor compressão mas mais lento
      })
      .toFile(outputPath);
    
    const stats = await sharp(outputPath).metadata();
    const sizeKB = Math.round(Buffer.byteLength(readFileSync(outputPath)) / 1024);
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${name}`);
    console.log(`   ${description}`);
    console.log(`   Dimensões: ${stats.width}x${stats.height}px`);
    console.log(`   Tamanho: ${sizeKB}KB (meta: ${targetSize})`);
    console.log(`   Tempo: ${duration}ms\n`);
    
    return { name, sizeKB, width: stats.width, height: stats.height };
  } catch (error) {
    console.error(`❌ Erro ao otimizar ${name}:`, error.message);
    return null;
  }
}

// Otimizar todas as variantes
const results = await Promise.all(
  optimizations.map(opt => optimizeImage(opt))
);

const successful = results.filter(Boolean);

console.log('\n📊 Resumo:');
console.log(`✅ ${successful.length}/${optimizations.length} imagens otimizadas`);
console.log(`💾 Total: ${successful.reduce((sum, r) => sum + r.sizeKB, 0)}KB\n`);

// Gerar configuração de sizes para Next.js Image
const sizesConfig = `
// Adicione ao Hero.tsx:
const HERO_IMAGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1400px";

// Use srcSet para servir imagem correta:
<Image
  src="/spitz-hero-desktop.webp"
  alt="..."
  fill
  priority
  sizes={HERO_IMAGE_SIZES}
  className="object-cover"
/>
`;

console.log('📝 Próximos passos:');
console.log('1. ✅ Imagens otimizadas criadas em /public');
console.log('2. 🔄 Next.js Image já usa srcSet automático');
console.log('3. 🚀 Fazer deploy e testar PSI novamente');
console.log('\n💡 LCP esperado: <2.5s (mobile) | <1.5s (desktop)\n');
