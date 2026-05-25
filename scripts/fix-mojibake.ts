#!/usr/bin/env tsx
/* eslint-disable no-console */

/**
 * Corrige textos com mojibake (UTF-8 interpretado como ISO-8859-1/latin1).
 * - Cria backup em blog_post_revisions (snapshot jsonb).
 * - Atualiza campos textuais somente quando necessário.
 *
 * Uso:
 *   npm run fix:mojibake          # dry-run (padrão)
 *   npm run fix:mojibake --write  # aplica alterações
 */

import process from "node:process";

import { supabaseAdmin, hasServiceRoleKey } from "../src/lib/supabaseAdmin";

type BlogPost = {
  id: string;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  content_mdx: string | null;
  updated_at: string | null;
};

const WRITE_MODE = process.argv.includes("--write");

if (!hasServiceRoleKey()) {
  console.warn("[fix-mojibake] SUPABASE_SERVICE_ROLE_KEY ausente. Abortando.");
  process.exit(1);
}

const client = supabaseAdmin();

function decodeIfNeeded(value: string | null) {
  if (!value) return { changed: false, value };
  if (!/[ÃÂ�]/.test(value)) {
    return { changed: false, value };
  }
  try {
    const decoded = Buffer.from(value, "latin1").toString("utf8");
    if (decoded === value) return { changed: false, value };
    return { changed: true, value: decoded };
  } catch {
    return { changed: false, value };
  }
}

async function run() {
  const { data, error } = await client
    .from("blog_posts")
    .select("id,title,excerpt,content,content_mdx,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[fix-mojibake] Falha ao buscar posts:", error.message);
    process.exit(1);
  }

  let totalPosts = 0;
  let totalFields = 0;

  for (const post of (data as BlogPost[]) ?? []) {
    const fixes = {
      title: decodeIfNeeded(post.title),
      excerpt: decodeIfNeeded(post.excerpt),
      content: decodeIfNeeded(post.content),
      content_mdx: decodeIfNeeded(post.content_mdx),
    };

    const changedFields = Object.entries(fixes).filter(([, result]) => result.changed);
    if (!changedFields.length) continue;

    totalPosts += 1;
    totalFields += changedFields.length;

    console.log(
      `[fix-mojibake] Post ${post.id} -> campos alterados: ${changedFields
        .map(([key]) => key)
        .join(", ")}`
    );

    if (!WRITE_MODE) continue;

    // Backup
    const { error: revisionError } = await client.from("blog_post_revisions").insert({
      post_id: post.id,
      snapshot: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        content_mdx: post.content_mdx,
        updated_at: post.updated_at,
      },
      reason: "fix-mojibake",
    });

    if (revisionError) {
      console.error(
        `[fix-mojibake] Falha ao criar revisão para ${post.id}:`,
        revisionError.message
      );
      continue;
    }

    const payload: Record<string, string | null> = {};
    for (const [key, result] of Object.entries(fixes)) {
      payload[key] = result.value;
    }

    const { error: updateError } = await client
      .from("blog_posts")
      .update(payload)
      .eq("id", post.id);

    if (updateError) {
      console.error(
        `[fix-mojibake] Falha ao atualizar ${post.id}:`,
        updateError.message
      );
    }
  }

  console.log(
    `[fix-mojibake] Resumo: ${totalPosts} posts com ${totalFields} campos corrigidos. Modo: ${
      WRITE_MODE ? "write" : "dry-run"
    }`
  );

  if (!WRITE_MODE) {
    console.log('Execute novamente com "--write" para aplicar as alterações.');
  }
}

run().catch((err) => {
  console.error("[fix-mojibake] Erro inesperado:", err);
  process.exit(1);
});

