import "server-only";

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";

import sharp from "sharp";
import { z } from "zod";

import { createLogger } from "@/lib/logger";

const logger = createLogger("ai:puppy-vision");

export type PuppyVisionDetections = {
  isSpitz: boolean;
  spitzConfidence: number;
  multipleDogs: boolean;
  messyBackground: boolean;
  lowLight: boolean;
  highNoise: boolean;
  duplicate: boolean;
  badPose: boolean;
};

export type PuppyVisionClassification = {
  color?: string | null;
  sexGuess?: "macho" | "femea" | "indefinido" | null;
  ageWeeks?: number | null;
  rarity?: "comum" | "raro" | "exclusivo" | null;
};

export type PuppyVisionSuggestions = {
  photography: string[];
  crop: string[];
  editing: string[];
};

export type PuppyVisionCard = {
  title: string;
  score: number;
  status: "premium" | "ok" | "critico";
  highlights: string[];
  alerts: string[];
  recommendations: string[];
};

export type PuppyVisionInsights = {
  score: number;
  detections: PuppyVisionDetections;
  classification: PuppyVisionClassification;
  suggestions: PuppyVisionSuggestions;
  ui: PuppyVisionCard;
  metadata: {
    hash: string;
    brightness: number;
    noise: number;
    sharpness: number;
    aspectRatio: number;
  };
  raw?: VisionPayload;
};

export type PuppyVisionOptions = {
  knownHashes?: string[];
  checkDuplicate?: (hash: string) => Promise<boolean>;
  puppyName?: string;
  cardTitle?: string;
  colorHint?: string;
  sexHint?: "macho" | "femea";
  ageWeeksHint?: number;
};

const runtimeHashes = new Map<string, number>();
const HASH_TTL_MS = 60 * 60 * 1000;

const VisionSchema = z.object({
  isSpitz: z.boolean(),
  spitzConfidence: z.number().min(0).max(1).optional(),
  multipleDogs: z.boolean().optional(),
  backgroundQuality: z.enum(["premium", "organizado", "neutro", "bagunca"]).optional(),
  lighting: z.enum(["ideal", "boa", "neutra", "baixa", "estourada"]).optional(),
  noiseLevel: z.enum(["baixo", "moderado", "alto"]).optional(),
  poseQuality: z.enum(["ideal", "boa", "ok", "ruim"]).optional(),
  duplicateSuspected: z.boolean().optional(),
  messyBackgroundReason: z.string().optional(),
  badPoseReason: z.string().optional(),
  color: z.string().optional(),
  sexGuess: z.enum(["macho", "femea", "indefinido"]).optional(),
  ageWeeks: z.number().min(0).max(52).optional(),
  rarity: z.enum(["comum", "raro", "exclusivo"]).optional(),
  photographyTips: z.array(z.string()).optional(),
  cropAdvice: z.array(z.string()).optional(),
  editingTips: z.array(z.string()).optional(),
});

type VisionPayload = z.infer<typeof VisionSchema>;

const DETECTION_WEIGHTS: Record<keyof PuppyVisionDetections, number> = {
  isSpitz: 0,
  spitzConfidence: 0,
  multipleDogs: 18,
  messyBackground: 14,
  lowLight: 15,
  highNoise: 9,
  duplicate: 25,
  badPose: 12,
};

const STATUS_RULES: Array<{ min: number; status: PuppyVisionCard["status"] }> = [
  { min: 85, status: "premium" },
  { min: 65, status: "ok" },
  { min: 0, status: "critico" },
];

export async function analyzePuppyVision(
  input: File | string | Buffer,
  options: PuppyVisionOptions = {},
): Promise<PuppyVisionInsights> {
  const buffer = await toBuffer(input);
  cleanupHashes();
  const hash = createHash("sha1").update(buffer).digest("hex");
  const duplicate = await detectDuplicate(hash, options);

  const image = sharp(buffer);
  const metadata = await image.metadata();
  const stats = await image.stats();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const brightness = calculateBrightness(stats);
  const noise = calculateNoise(stats);
  const sharpness = await measureSharpness(image, options);
  const aspectRatio = height ? Number((width / height).toFixed(2)) : 1;

  const lowLight = brightness < 95;
  const highNoise = noise > 22;
  const messyBackgroundHeuristic = await detectBackgroundComplexity(image);
  const badPoseHeuristic = sharpness < 110;

  const vision = await runVisionModel(buffer, metadata.format ?? "jpeg", options);

  const detections: PuppyVisionDetections = {
    isSpitz: vision?.isSpitz ?? true,
    spitzConfidence: Math.round(((vision?.spitzConfidence ?? 0.85) + (vision?.isSpitz === false ? -0.2 : 0)) * 100) / 100,
    multipleDogs: vision?.multipleDogs ?? false,
    messyBackground: vision?.backgroundQuality === "bagunca" || messyBackgroundHeuristic,
    lowLight,
    highNoise,
    duplicate,
    badPose: vision?.poseQuality === "ruim" || badPoseHeuristic,
  };

  let penalty = 0;
  if (!detections.isSpitz) penalty += 35;
  if ((vision?.spitzConfidence ?? 1) < 0.7) penalty += 10;
  penalty += Object.entries(DETECTION_WEIGHTS)
    .filter(([key]) => key !== "isSpitz" && key !== "spitzConfidence")
    .reduce((sum, [key, weight]) => {
      // @ts-expect-error runtime access
      return detections[key] ? sum + weight : sum;
    }, 0);

  const score = clampScore(100 - penalty);

  const classification: PuppyVisionClassification = {
    color: vision?.color ?? options.colorHint ?? null,
    sexGuess: vision?.sexGuess ?? options.sexHint ?? "indefinido",
    ageWeeks:
      vision?.ageWeeks
        ? Math.round(vision.ageWeeks)
        : typeof options.ageWeeksHint === "number"
          ? Math.round(options.ageWeeksHint)
          : null,
    rarity: vision?.rarity ?? null,
  };

  const suggestions: PuppyVisionSuggestions = {
    photography: uniqueList([
      lowLight ? "Use luz lateral suave ou ring light difusa." : null,
      highNoise ? "Abaixe o ISO e fotografe novamente em ambiente mais claro." : null,
      badPoseHeuristic ? "Peça para o handler segurar petiscos para manter o olhar na camera." : null,
      ...(vision?.photographyTips ?? []),
    ]),
    crop: uniqueList([
      aspectRatio < 0.8 || aspectRatio > 1.4 ? "Ajuste o enquadramento para proporcao 4:5 ou 5:4." : null,
      ...(vision?.cropAdvice ?? []),
    ]),
    editing: uniqueList([
      highNoise ? "Aplique reducao de ruído leve no Lightroom." : null,
      ...(vision?.editingTips ?? []),
    ]),
  };

  const ui = buildUICard({
    score,
    detections,
    classification,
    suggestions,
    options,
    vision,
  });

  return {
    score,
    detections,
    classification,
    suggestions,
    ui,
    metadata: {
      hash,
      brightness,
      noise,
      sharpness,
      aspectRatio,
    },
    raw: vision ?? undefined,
  };
}

async function toBuffer(input: File | string | Buffer): Promise<Buffer> {
  if (typeof input === "string") {
    return fs.readFile(input);
  }
  if (Buffer.isBuffer(input)) return input;
  if (typeof input === "object" && input !== null && "arrayBuffer" in input) {
    const arr = await (input as File).arrayBuffer();
    return Buffer.from(arr);
  }
  throw new Error("Unsupported input for PuppyVisionAI");
}

async function detectDuplicate(hash: string, options: PuppyVisionOptions) {
  if (options.knownHashes?.includes(hash)) return true;
  if (options.checkDuplicate) {
    try {
      const exists = await options.checkDuplicate(hash);
      if (exists) return true;
    } catch (error) {
      logger.warn("puppyvision_duplicate_hook_failed", { error: String(error) });
    }
  }
  if (runtimeHashes.has(hash)) return true;
  runtimeHashes.set(hash, Date.now());
  return false;
}

function cleanupHashes() {
  const now = Date.now();
  for (const [hash, ts] of runtimeHashes.entries()) {
    if (now - ts > HASH_TTL_MS) runtimeHashes.delete(hash);
  }
}

function calculateBrightness(stats: sharp.Stats): number {
  const channels = stats.channels?.slice(0, 3) ?? [];
  if (!channels.length) return 140;
  return channels.reduce((sum, ch) => sum + ch.mean, 0) / channels.length;
}

function calculateNoise(stats: sharp.Stats): number {
  const channels = stats.channels?.slice(0, 3) ?? [];
  if (!channels.length) return 0;
  return channels.reduce((sum, ch) => sum + ch.stdev, 0) / channels.length;
}

async function measureSharpness(image: sharp.Sharp, options: PuppyVisionOptions): Promise<number> {
  try {
    const hints: string[] = [];
    if (options.puppyName) hints.push(`filhote ${options.puppyName}`);
    if (options.colorHint) hints.push(`cor esperada ${options.colorHint}`);
    if (options.sexHint) hints.push(`sexo previsto ${options.sexHint}`);
    if (typeof options.ageWeeksHint === "number") hints.push(`idade prevista ~${Math.round(options.ageWeeksHint)} semanas`);
    const hintBlock = hints.length ? `Contexto conhecido: ${hints.join(" • ")}.` : "Contexto conhecido: nenhum.";

    const requirements = `Analise esta foto pensando como um diretor de marketing de canil premium.
DETETAR:
- "isSpitz": confirme se e um Spitz Alemao real; use "spitzConfidence" (0-1) e "multipleDogs" quando houver outros pets.
- "messyBackground": identifique fundo baguncado ou com objetos que distraiam; use "backgroundQuality" e descreva em "messyBackgroundReason".
- "lighting": classifique luz (ideal, boa, neutra, baixa, estourada) e marque "lowLight" se estiver ruim.
- "noiseLevel": avalie ruído/ISO alto.
- "poseQuality": avalie se a pose e comercial (pet inteiro, olhar para camera); explique em "badPoseReason" quando ruim.
- "duplicateSuspected": true quando a cena parece repetida de outra foto.
CLASSIFICAR:
- "color": descreva cor real do Spitz.
- "sexGuess": macho|femea|indefinido (apenas se houver evidencias visuais).
- "ageWeeks": idade estimada em semanas (0-52).
- "rarity": comum|raro|exclusivo com base na cor e marcacoes.
SUGERIR:
- "photographyTips": ate 3 dicas objetivas para refazer a foto.
- "cropAdvice": ate 2 orientacoes de enquadramento/recorte.
- "editingTips": ate 2 ajustes rapidos de edicao.
${hintBlock}
Responda SOMENTE em JSON com os campos solicitados.`;
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
    return count ? sum / count : 0;
  } catch (error) {
    logger.warn("puppyvision_sharpness_failed", { error: String(error) });
    return 200;
  }
}

async function detectBackgroundComplexity(image: sharp.Sharp) {
  try {
    const { data, info } = await image
      .clone()
      .resize(256, 256, { fit: "inside" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixels = Array.from(data);
    const avg = pixels.reduce((sum, value) => sum + value, 0) / pixels.length;
    const variance = pixels.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / pixels.length;
    return variance > 5000;
  } catch (error) {
    logger.warn("puppyvision_background_failed", { error: String(error) });
    return false;
  }
}

async function runVisionModel(buffer: Buffer, format: string, options: PuppyVisionOptions) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.warn("puppyvision_missing_api_key");
    return null;
  }
  try {
    const reduced = await sharp(buffer).resize(768, 768, { fit: "inside" }).jpeg({ quality: 85 }).toBuffer();
    const base64 = reduced.toString("base64");
    const mime = format === "png" ? "image/png" : "image/jpeg";
    const endpoint = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1/chat/completions";
    const model = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";

    // requirements block from measureSharpness
    const hints: string[] = [];
    if (options.puppyName) hints.push(`filhote ${options.puppyName}`);
    if (options.colorHint) hints.push(`cor esperada ${options.colorHint}`);
    if (options.sexHint) hints.push(`sexo previsto ${options.sexHint}`);
    if (typeof options.ageWeeksHint === "number") hints.push(`idade prevista ~${Math.round(options.ageWeeksHint)} semanas`);
    const hintBlock = hints.length ? `Contexto conhecido: ${hints.join(" • ")}.` : "Contexto conhecido: nenhum.";
    const requirements = `Analise esta foto pensando como um diretor de marketing de canil premium.\nDETETAR:\n- \"isSpitz\": confirme se e um Spitz Alemao real; use \"spitzConfidence\" (0-1) e \"multipleDogs\" quando houver outros pets.\n- \"messyBackground\": identifique fundo baguncado ou com objetos que distraiam; use \"backgroundQuality\" e descreva em \"messyBackgroundReason\".\n- \"lighting\": classifique luz (ideal, boa, neutra, baixa, estourada) e marque \"lowLight\" se estiver ruim.\n- \"noiseLevel\": avalie ruído/ISO alto.\n- \"poseQuality\": avalie se a pose e comercial (pet inteiro, olhar para camera); explique em \"badPoseReason\" quando ruim.\n- \"duplicateSuspected\": true quando a cena parece repetida de outra foto.\nCLASSIFICAR:\n- \"color\": descreva cor real do Spitz.\n- \"sexGuess\": macho|femea|indefinido (apenas se houver evidencias visuais).\n- \"ageWeeks\": idade estimada em semanas (0-52).\n- \"rarity\": comum|raro|exclusivo com base na cor e marcacoes.\nSUGERIR:\n- \"photographyTips\": ate 3 dicas objetivas para refazer a foto.\n- \"cropAdvice\": ate 2 orientacoes de enquadramento/recorte.\n- \"editingTips\": ate 2 ajustes rapidos de edicao.\n${hintBlock}\nResponda SOMENTE em JSON com os campos solicitados.`;

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
              "Voce e um avaliador tecnico de fotos comerciais de Spitz Alemao. Seja objetivo e responda apenas no JSON pedido.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: requirements,
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
      logger.warn("puppyvision_openai_failed", { status: response.status, detail });
      return null;
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      logger.warn("puppyvision_invalid_json", { error: String(error), content });
      return null;
    }

    const safe = VisionSchema.safeParse(parsed);
    if (!safe.success) {
      logger.warn("puppyvision_schema_error", { issues: safe.error.flatten() });
      return null;
    }
    return safe.data;
  } catch (error) {
    logger.warn("puppyvision_vision_error", { error: String(error) });
    return null;
  }
}

function buildUICard({
  score,
  detections,
  classification,
  suggestions,
  options,
  vision,
}: {
  score: number;
  detections: PuppyVisionDetections;
  classification: PuppyVisionClassification;
  suggestions: PuppyVisionSuggestions;
  options: PuppyVisionOptions;
  vision: VisionPayload | null;
}): PuppyVisionCard {
  const status = STATUS_RULES.find((rule) => score >= rule.min)?.status ?? "critico";
  const highlights = uniqueList([
    classification.color ? `Cor identificada: ${classification.color}` : null,
    classification.sexGuess && classification.sexGuess !== "indefinido"
      ? `Sexo sugerido: ${classification.sexGuess}`
      : null,
    classification.ageWeeks ? `~${classification.ageWeeks} semanas` : null,
    classification.rarity ? `Raridade: ${classification.rarity}` : null,
  ]);

  const alerts = uniqueList([
    !detections.isSpitz ? "Imagem pode nao ser de um Spitz." : null,
    detections.multipleDogs ? "Ha mais de um pet na foto, pode confundir." : null,
    detections.messyBackground ? vision?.messyBackgroundReason ?? "Fundo poluido." : null,
    detections.lowLight ? "Baixa luz detectada." : null,
    detections.highNoise ? "Ruido alto identificado." : null,
    detections.badPose ? vision?.badPoseReason ?? "Pose nao ideal." : null,
    detections.duplicate ? "Foto semelhante ja foi enviada." : null,
  ]);

  const recommendations = uniqueList([
    ...suggestions.photography.slice(0, 2),
    suggestions.crop[0] ?? null,
    suggestions.editing[0] ?? null,
  ]);

  const title = options.cardTitle ?? (options.puppyName ? `Qualidade • ${options.puppyName}` : "Qualidade da foto");

  return {
    title,
    score,
    status,
    highlights,
    alerts,
    recommendations,
  };
}

function uniqueList(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}
