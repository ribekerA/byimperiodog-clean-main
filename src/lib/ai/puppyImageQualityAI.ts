import "server-only";

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";

import sharp from "sharp";
import { z } from "zod";

import { createLogger } from "@/lib/logger";

const logger = createLogger("ai:puppy-image-quality");

export type PuppyImageAIResult = {
  score: number;
  issues: string[];
  recommendations: string[];
};

export type PuppyImageAnalysisOptions = {
  knownHashes?: string[];
  puppyName?: string;
  allowVision?: boolean;
  checkDuplicate?: (hash: string) => Promise<boolean>;
};

const runtimeHashes = new Map<string, number>();
const DUPLICATE_TTL_MS = 60 * 60 * 1000;

const VisionSchema = z.object({
  isSpitz: z.boolean().optional(),
  confidence: z.number().min(0).max(1).optional(),
  lighting: z.enum(["excelente", "boa", "regular", "ruim"]).optional(),
  focus: z.enum(["nitido", "ok", "suave", "desfocado"]).optional(),
  framing: z.enum(["centralizado", "ok", "corte", "ruim"]).optional(),
  noise: z.enum(["baixo", "moderado", "alto"]).optional(),
  looksRepeated: z.boolean().optional(),
  salesRisk: z.enum(["alto", "medio", "baixo"]).optional(),
  improvements: z.array(z.string().max(220)).optional(),
});

type VisionResult = z.infer<typeof VisionSchema>;

export async function analyzePuppyImage(
  input: File | string | Buffer,
  options: PuppyImageAnalysisOptions = {},
): Promise<PuppyImageAIResult> {
  const buffer = await toBuffer(input);
  const hash = createHash("sha1").update(buffer).digest("hex");
  cleanupRuntimeHashes();

  const duplicate = await detectDuplicate(hash, options);
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const stats = await image.stats();

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const ratio = width && height ? width / height : 1;
  const brightness = calculateBrightness(stats);
  const noise = calculateNoise(stats);
  const sharpness = await measureSharpness(image);

  const issues: string[] = [];
  const recommendations: string[] = [];
  let penalty = 0;

  const addIssue = (message: string, suggestion?: string, weight = 12) => {
    if (!issues.includes(message)) {
      issues.push(message);
    }
    if (suggestion && !recommendations.includes(suggestion)) {
      recommendations.push(suggestion);
    }
    penalty += weight;
  };

  const minResolution = 1500;
  if (width < minResolution || height < minResolution) {
    addIssue(
      `Resolução baixa (${width}x${height}).`,
      "Envie arquivos acima de 1500px no lado menor.",
      18,
    );
  }

  if (sharpness < 120) {
    addIssue(
      "Foco/Nitidez insuficientes.",
      "Use luz natural, mantenha a câmera estável e foque nos olhos do filhote.",
      22,
    );
  }

  if (brightness < 90) {
    addIssue(
      "Iluminação baixa.",
      "Prefira ambientes com luz lateral suave ou reforço de iluminação difusa.",
    );
  } else if (brightness > 210) {
    addIssue(
      "Iluminação estourada.",
      "Reduza a exposição ou fotografe longe de fontes diretas de luz.",
    );
  }

  if (noise > 25) {
    addIssue(
      "Ruído visível na imagem.",
      "Use ISO mais baixo ou refaça em ambiente mais iluminado.",
    );
  }

  if (ratio < 0.7 || ratio > 1.4) {
    addIssue(
      "Enquadramento desequilibrado.",
      "Mantenha o filhote centralizado com cortes verticais entre 4:5 e 5:4.",
      10,
    );
  }

  if (duplicate) {
    addIssue(
      "Foto duplicada detectada.",
      "Registre novos ângulos exclusivos para reforçar confiança.",
      25,
    );
  }

  const vision = (options.allowVision ?? true)
    ? await runVisionCheck(buffer, metadata.format)
    : null;

  if (vision) {
    if (vision.isSpitz === false) {
      addIssue(
        "IA sinalizou que a foto pode não ser de um Spitz.",
        "Use apenas fotos reais dos filhotes Spitz disponibilizados para venda.",
        30,
      );
    }

    if (vision.lighting === "ruim") {
      addIssue(
        "IA apontou iluminação ruim.",
        "Abra cortinas ou use luz contínua para realçar a pelagem.",
      );
    }

    if (vision.focus === "desfocado" || vision.focus === "suave") {
      addIssue(
        "IA identificou foco impreciso.",
        "Use foco automático no rosto e dispare diversas fotos.",
        18,
      );
    }

    if (vision.framing === "corte" || vision.framing === "ruim") {
      addIssue(
        "IA sugeriu enquadramento ruim.",
        "Mostre o corpo todo do filhote, evitando cortes em patas ou orelhas.",
        14,
      );
    }

    if (vision.looksRepeated) {
      addIssue(
        "IA suspeita que seja foto repetida ou de catálogo.",
        "Atualize com um novo clique exclusivo do filhote.",
        20,
      );
    }

    if (vision.salesRisk === "alto") {
      addIssue(
        "Qualidade atual pode comprometer conversão.",
        "Combine luz suave + cenário clean e refaça com o filhote calmo.",
        24,
      );
    }

    vision.improvements?.forEach((tip) => {
      if (!recommendations.includes(tip)) {
        recommendations.push(tip);
      }
    });
  }

  const score = Math.max(0, Math.min(100, 100 - penalty));

  if (score < 70 && !issues.includes("Qualidade atual pode comprometer conversão.")) {
    addIssue(
      "Qualidade abaixo do padrão premium.",
      "Reaproveite o setup oficial (softbox + fundo neutro) para refazer o ensaio.",
      0,
    );
  }

  return {
    score,
    issues,
    recommendations,
  };
}

async function toBuffer(input: File | string | Buffer): Promise<Buffer> {
  if (typeof input === "string") {
    return fs.readFile(input);
  }
  if (Buffer.isBuffer(input)) {
    return input;
  }
  if (typeof input === "object" && input !== null && "arrayBuffer" in input) {
    const arrayBuffer = await (input as File).arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  throw new Error("Unsupported file input for analyzePuppyImage");
}

function calculateBrightness(stats: sharp.Stats): number {
  const rgb = stats.channels?.slice(0, 3) ?? [];
  if (!rgb.length) return 140;
  const avg = rgb.reduce((sum, ch) => sum + ch.mean, 0) / rgb.length;
  return avg;
}

function calculateNoise(stats: sharp.Stats): number {
  const rgb = stats.channels?.slice(0, 3) ?? [];
  if (!rgb.length) return 0;
  return rgb.reduce((sum, ch) => sum + ch.stdev, 0) / rgb.length;
}

async function measureSharpness(image: sharp.Sharp): Promise<number> {
  try {
    const { data, info } = await image
      .clone()
      .greyscale()
      .resize(512, 512, { fit: "inside" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8Array(data);
    let sum = 0;
    let count = 0;
    for (let y = 1; y < info.height - 1; y++) {
      for (let x = 1; x < info.width - 1; x++) {
        const idx = y * info.width + x;
        const center = pixels[idx];
        const top = pixels[(y - 1) * info.width + x];
        const bottom = pixels[(y + 1) * info.width + x];
        const left = pixels[y * info.width + (x - 1)];
        const right = pixels[y * info.width + (x + 1)];
        const laplacian = Math.abs(4 * center - (top + bottom + left + right));
        sum += laplacian * laplacian;
        count++;
      }
    }

    return count > 0 ? sum / count : 0;
  } catch (error) {
    logger.warn("sharpness_measure_failed", { error: String(error) });
    return 200;
  }
}

async function detectDuplicate(hash: string, options: PuppyImageAnalysisOptions) {
  if (options.knownHashes?.includes(hash)) return true;
  if (options.checkDuplicate) {
    try {
      const exists = await options.checkDuplicate(hash);
      if (exists) return true;
    } catch (error) {
      logger.warn("duplicate_check_failed", { error: String(error) });
    }
  }

  if (runtimeHashes.has(hash)) return true;
  runtimeHashes.set(hash, Date.now());
  return false;
}

function cleanupRuntimeHashes() {
  const now = Date.now();
  for (const [hash, ts] of runtimeHashes.entries()) {
    if (now - ts > DUPLICATE_TTL_MS) {
      runtimeHashes.delete(hash);
    }
  }
}

async function runVisionCheck(buffer: Buffer, format?: string | null): Promise<VisionResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const reduced = await sharp(buffer).resize(768, 768, { fit: "inside" }).jpeg({ quality: 85 }).toBuffer();
    const base64 = reduced.toString("base64");
    const mime = format === "png" ? "image/png" : "image/jpeg";
    const endpoint = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1/chat/completions";
    const model = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Você é um avaliador de imagens de filhotes premium. Analise foco, luz, enquadramento e confirme se é um Spitz Alemão. Responda APENAS em JSON.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Avalie a foto e retorne JSON com os campos: isSpitz (boolean), confidence (0-1), lighting (excelente|boa|regular|ruim), focus (nitido|ok|suave|desfocado), framing (centralizado|ok|corte|ruim), noise (baixo|moderado|alto), looksRepeated (boolean), salesRisk (alto|medio|baixo), improvements (lista de dicas curtas).",
              },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${base64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      logger.warn("vision_call_failed", { status: response.status, detail });
      return null;
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      logger.warn("vision_invalid_json", { error: String(error), content });
      return null;
    }

    const safe = VisionSchema.safeParse(parsed);
    if (!safe.success) {
      logger.warn("vision_schema_mismatch", { issues: safe.error.flatten() });
      return null;
    }

    return safe.data;
  } catch (error) {
    logger.warn("vision_analysis_error", { error: String(error) });
    return null;
  }
}
