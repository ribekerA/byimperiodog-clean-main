/**
 * Image Quality Analyzer
 * Detecta problemas de qualidade em imagens
 */

import sharp, { type Sharp, type Stats } from 'sharp';
import { IMAGE_CONFIG } from './config';

export interface QualityReport {
  filePath: string;
  passed: boolean;
  issues: QualityIssue[];
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    brightness?: number;
    sharpness?: number;
  };
}

export interface QualityIssue {
  severity: 'error' | 'warning' | 'info';
  type:
    | 'low_resolution'
    | 'blur'
    | 'underexposed'
    | 'overexposed'
    | 'large_file'
    | 'wrong_format';
  message: string;
}

/**
 * Analisa a qualidade de uma imagem
 */
export async function analyzeImageQuality(
  filePath: string
): Promise<QualityReport> {
  const issues: QualityIssue[] = [];

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    const stats = await image.stats();

    const { width = 0, height = 0, format = 'unknown', size = 0 } = metadata;

    // 1. Verificar resolução mínima
    if (
      width < IMAGE_CONFIG.quality.minWidth ||
      height < IMAGE_CONFIG.quality.minHeight
    ) {
      issues.push({
        severity: 'error',
        type: 'low_resolution',
        message: `Resolução muito baixa: ${width}x${height} (mínimo: ${IMAGE_CONFIG.quality.minWidth}x${IMAGE_CONFIG.quality.minHeight})`,
      });
    }

    // 2. Verificar tamanho do arquivo
    if (size > IMAGE_CONFIG.quality.maxFileSize * 2) {
      issues.push({
        severity: 'warning',
        type: 'large_file',
        message: `Arquivo muito grande: ${(size / 1024).toFixed(0)}KB (recomendado: < ${IMAGE_CONFIG.quality.maxFileSize / 1024}KB)`,
      });
    }

    // 3. Verificar exposição (brilho médio)
    const brightness = calculateBrightness(stats);
    if (brightness < IMAGE_CONFIG.quality.exposureMin) {
      issues.push({
        severity: 'warning',
        type: 'underexposed',
        message: `Imagem subexposta (brilho médio: ${brightness.toFixed(0)})`,
      });
    } else if (brightness > IMAGE_CONFIG.quality.exposureMax) {
      issues.push({
        severity: 'warning',
        type: 'overexposed',
        message: `Imagem superexposta (brilho médio: ${brightness.toFixed(0)})`,
      });
    }

    // 4. Verificar nitidez (blur detection via Laplacian)
    const sharpness = await detectBlur(image);
    if (sharpness < IMAGE_CONFIG.quality.blurThreshold) {
      issues.push({
        severity: 'warning',
        type: 'blur',
        message: `Imagem desfocada (nitidez: ${sharpness.toFixed(0)}, mínimo: ${IMAGE_CONFIG.quality.blurThreshold})`,
      });
    }

    // 5. Verificar formato
    if (!['jpeg', 'jpg', 'png', 'webp'].includes(format)) {
      issues.push({
        severity: 'error',
        type: 'wrong_format',
        message: `Formato não suportado: ${format}`,
      });
    }

    return {
      filePath,
      passed: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
      metadata: {
        width,
        height,
        format,
        size,
        brightness,
        sharpness,
      },
    };
  } catch (error) {
    return {
      filePath,
      passed: false,
      issues: [
        {
          severity: 'error',
          type: 'wrong_format',
          message: `Erro ao analisar imagem: ${error instanceof Error ? error.message : 'Desconhecido'}`,
        },
      ],
      metadata: {
        width: 0,
        height: 0,
        format: 'unknown',
        size: 0,
      },
    };
  }
}

/**
 * Calcula brilho médio da imagem
 */
function calculateBrightness(stats: Stats): number {
  const channels = stats.channels;
  if (!channels || channels.length === 0) return 128;

  // Média dos canais (excluindo alpha se existir)
  const rgbChannels = channels.slice(0, 3);
  const avgBrightness =
    rgbChannels.reduce((sum, ch) => sum + ch.mean, 0) / rgbChannels.length;

  return avgBrightness;
}

/**
 * Detecta blur usando variância Laplaciana
 * Valores baixos = imagem desfocada
 */
async function detectBlur(image: Sharp): Promise<number> {
  try {
    // Converte para escala de cinza e aplica Laplacian
    const { data, info } = await image
      .clone()
      .greyscale()
      .resize(512, 512, { fit: 'inside' }) // Redimensiona para análise rápida
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Calcula variância do gradiente (aproximação do Laplacian)
    const pixels = new Uint8Array(data);
    const width = info.width;
    const height = info.height;

    let sum = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const center = pixels[idx];
        const top = pixels[(y - 1) * width + x];
        const bottom = pixels[(y + 1) * width + x];
        const left = pixels[y * width + (x - 1)];
        const right = pixels[y * width + (x + 1)];

        // Laplacian = 4*center - (top + bottom + left + right)
        const laplacian = Math.abs(
          4 * center - (top + bottom + left + right)
        );
        sum += laplacian * laplacian;
        count++;
      }
    }

    // Variância
    const variance = count > 0 ? sum / count : 0;
    return variance;
  } catch (error) {
    console.warn('Erro ao detectar blur:', error);
    return IMAGE_CONFIG.quality.blurThreshold; // Assume OK em caso de erro
  }
}

/**
 * Formata relatório de qualidade para console
 */
export function formatQualityReport(report: QualityReport): string {
  const lines: string[] = [];

  lines.push(`\n📊 Análise de Qualidade: ${report.filePath}`);
  lines.push(`   Resolução: ${report.metadata.width}x${report.metadata.height}`);
  lines.push(`   Tamanho: ${(report.metadata.size / 1024).toFixed(0)}KB`);
  lines.push(`   Formato: ${report.metadata.format}`);

  if (report.metadata.brightness) {
    lines.push(`   Brilho: ${report.metadata.brightness.toFixed(0)}/255`);
  }

  if (report.metadata.sharpness) {
    lines.push(`   Nitidez: ${report.metadata.sharpness.toFixed(0)}`);
  }

  if (report.issues.length === 0) {
    lines.push(`   ✅ Qualidade OK`);
  } else {
    lines.push(`\n   ⚠️  Problemas encontrados:`);
    report.issues.forEach((issue) => {
      const icon =
        issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`   ${icon} ${issue.message}`);
    });
  }

  return lines.join('\n');
}
