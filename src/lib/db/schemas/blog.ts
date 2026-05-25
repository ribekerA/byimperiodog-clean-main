import { z } from "zod";

const bannedPattern = /\b(ado[cç][aã]o|doa[cç][aã]o|boutique)\b/i;
const spitzPattern = /(spitz\s+alem[aã]o(?:\s+an[aã]o)?)/gi;
const luluPattern = /(lulu\s+da\s+pomer[aã]nia)/i;
const cernelhaPattern = /\bcernelha\b/i;

function enforceContentRules(value: string | null | undefined, field: string) {
  if (!value) return true;
  const input = value.normalize("NFC");
  if (bannedPattern.test(input)) {
    throw new Error(`O campo ${field} contém termos proibidos (adoção/doação/boutique).`);
  }
  if (cernelhaPattern.test(input) && !/cernelha\s*\(altura\)/i.test(input)) {
    throw new Error(`Use "cernelha (altura)" no campo ${field}.`);
  }
  const matches = [...input.matchAll(spitzPattern)];
  for (const match of matches) {
    const surrounding = input.slice(Math.max(0, (match.index ?? 0) - 80), (match.index ?? 0) + match[0].length + 80);
    if (!luluPattern.test(surrounding)) {
      throw new Error(`Sempre utilize "Spitz Alemão (Lulu da Pomerânia)" no campo ${field}.`);
    }
  }
  return true;
}

const trim = (schema: z.ZodTypeAny) => schema.transform((value: string) => value.trim());

export const postContentSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: trim(z.string().min(6).max(140)),
    subtitle: trim(z.string().max(160)).optional().nullable(),
    slug: trim(z.string().min(3).max(160).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen.")),
    excerpt: trim(z.string().max(320)).optional().nullable(),
    content: z.string().min(50, "Conteúdo muito curto.").max(200000),
    status: z.enum(["draft", "review", "scheduled", "published", "archived"]).default("draft"),
    category: trim(z.string().max(120)).optional().nullable(),
    tags: z.array(trim(z.string().min(1).max(64))).max(20).optional(),
    coverUrl: trim(z.string().url("URL inválida")).optional().nullable(),
    coverAlt: trim(z.string().max(160)).optional().nullable(),
    seoTitle: trim(z.string().max(70)).optional().nullable(),
    seoDescription: trim(z.string().max(160)).optional().nullable(),
    ogImageUrl: trim(z.string().url("URL inválida")).optional().nullable(),
    scheduledAt: z.string().datetime().optional().nullable(),
    publishedAt: z.string().datetime().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    try {
      enforceContentRules(data.title, "título");
      enforceContentRules(data.subtitle ?? null, "subtítulo");
      enforceContentRules(data.excerpt ?? null, "resumo");
      enforceContentRules(data.content, "conteúdo");
      enforceContentRules(data.coverAlt ?? null, "alt da imagem");
      enforceContentRules(data.seoTitle ?? null, "SEO title");
      enforceContentRules(data.seoDescription ?? null, "SEO description");
    } catch (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error instanceof Error ? error.message : String(error) });
    }
  });

export const bulkActionSchema = z.object({
  action: z.enum(["publish", "archive", "delete", "schedule"]),
  postIds: z.array(z.string().uuid()).min(1),
  scheduleAt: z.string().datetime().optional(),
});

export const scheduleInputSchema = z.object({
  postId: z.string().uuid(),
  runAt: z.string().datetime(),
  repeatInterval: z.number().int().positive().optional().nullable(),
});

export const commentModerationSchema = z.object({
  commentIds: z.array(z.string().uuid()).min(1),
  status: z.enum(["approved", "rejected", "spam", "pending"]),
});

export type PostContentInput = z.infer<typeof postContentSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type ScheduleInput = z.infer<typeof scheduleInputSchema>;
export type CommentModerationInput = z.infer<typeof commentModerationSchema>;
