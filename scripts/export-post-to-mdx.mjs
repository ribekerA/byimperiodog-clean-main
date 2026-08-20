#!/usr/bin/env node
/**
 * Exporta um post da tabela `blog_posts` para content/posts/<slug>.mdx.
 *
 * Por que este script existe
 * --------------------------
 * O blog tem duas fontes e elas nao sao equivalentes. O que esta em
 * content/posts/*.mdx passa por scripts/quality-gate.mjs no prebuild, entra no
 * git com autor e data, e so vai ao ar depois que alguem leu o diff. O que
 * esta no banco vira pagina publica assim que a coluna `status` muda para
 * `published` — sem revisao, sem diff, sem historico.
 *
 * A decisao foi: IA escreve, mas quem publica e o git. As rotas de IA do admin
 * continuam gravando no banco como rascunho; este script e a ponte do rascunho
 * para o arquivo. Depois dele o caminho e o normal do projeto: ler o texto,
 * ajustar, `git add`, `git commit`, e o build reprova se o artigo nao passar
 * nas regras editoriais.
 *
 * Isso troca "publicar por IA" por "revisar o que a IA escreveu", que e a
 * unica versao disso que nao aposta a reputacao do dominio em um prompt.
 *
 * Uso
 * ---
 *   node scripts/export-post-to-mdx.mjs <slug>
 *   node scripts/export-post-to-mdx.mjs <slug> --forcar   (sobrescreve o .mdx)
 *
 * Precisa de NEXT_PUBLIC_SUPABASE_URL e de SUPABASE_SERVICE_ROLE_KEY (ou
 * NEXT_PUBLIC_SUPABASE_ANON_KEY, se o rascunho estiver legivel pelo anon).
 *
 * O script NAO publica nada: escreve um arquivo e para. O frontmatter sai com
 * `sources:` vazio de proposito — fonte externa e a unica coisa que a IA nao
 * pode preencher sozinha sem risco de inventar referencia, e o quality-gate
 * avisa quando falta.
 */
import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const DESTINO = path.join(process.cwd(), "content", "posts");

const [, , slug, ...flags] = process.argv;
const forcar = flags.includes("--forcar") || flags.includes("--force");

if (!slug) {
  console.error("uso: node scripts/export-post-to-mdx.mjs <slug> [--forcar]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "faltam as variaveis do Supabase (NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)."
  );
  process.exit(1);
}

/**
 * Escapa para o parser de frontmatter do projeto, que e escrito a mao em
 * scripts/gen-contentlayer.mjs e faz `val.slice(1, -1)` — ou seja, tira a
 * primeira e a ultima aspa e nao desescapa nada. Duplicar a aspa como o YAML
 * manda deixaria o '' visivel no titulo publicado, entao a saida troca de
 * delimitador em vez de escapar.
 */
function escalar(valor) {
  const s = String(valor ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();
  if (!s.includes("'")) return `'${s}'`;
  if (!s.includes('"')) return `"${s}"`;
  // Tem os dois tipos de aspa: o apostrofo vira o tipografico, que e o certo
  // em portugues e nao colide com o delimitador.
  return `'${s.replace(/'/g, "’")}'`;
}

function apenasData(iso) {
  return String(iso ?? "").slice(0, 10);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: post, error } = await sb
  .from("blog_posts")
  .select(
    "slug,title,excerpt,seo_description,content_mdx,cover_url,cover_alt,published_at,created_at,category,tags,status"
  )
  .eq("slug", slug)
  .maybeSingle();

if (error) {
  console.error("erro ao ler o post:", error.message);
  process.exit(1);
}
if (!post) {
  console.error(`nenhum post com slug "${slug}".`);
  process.exit(1);
}

const destino = path.join(DESTINO, `${post.slug}.mdx`);
if (fs.existsSync(destino) && !forcar) {
  console.error(
    `${path.relative(process.cwd(), destino)} ja existe. Use --forcar para sobrescrever ` +
      "(o git guarda a versao anterior, entao da para comparar depois)."
  );
  process.exit(1);
}

const descricao = post.seo_description?.trim() || post.excerpt?.trim() || "";
const data = apenasData(post.published_at || post.created_at || new Date().toISOString());
const tags = Array.isArray(post.tags) ? post.tags.filter(Boolean) : [];

const frontmatter = [
  "---",
  `title: ${escalar(post.title)}`,
  `description: ${escalar(descricao)}`,
  `date: ${escalar(data)}`,
  // cover_alt fica de fora de proposito: nenhuma chave do frontmatter e lida
  // para alt de capa hoje, e escrever chave que ninguem consome so cria a
  // impressao de que o alt esta definido.
  ...(post.cover_url ? [`cover: ${escalar(post.cover_url)}`] : []),
  ...(tags.length ? ["tags:", ...tags.map((t) => `  - ${t}`)] : []),
  ...(post.category ? [`category: ${escalar(post.category)}`] : []),
  "author: 'By Império Dog'",
  "# Preencher antes de commitar: PUBLICADOR | TÍTULO | URL, uma fonte por linha.",
  "# O quality-gate avisa enquanto estiver vazio — artigo sem fonte externa é",
  "# opinião publicada, e é o que faz o Google e os modelos tratarem o texto",
  "# como conteúdo de marca em vez de referência.",
  "sources:",
  "---",
  "",
].join("\n");

fs.mkdirSync(DESTINO, { recursive: true });
fs.writeFileSync(destino, frontmatter + (post.content_mdx ?? "").trim() + "\n", "utf8");

const relativo = path.relative(process.cwd(), destino).replace(/\\/g, "/");
console.log(`escrito: ${relativo}`);
console.log(`status no banco: ${post.status}`);
console.log("");
console.log("proximo passo — o arquivo ainda NAO esta publicado:");
console.log(`  1. ler ${relativo} inteiro e corrigir o que a IA errou`);
console.log("  2. preencher `sources:` com fonte externa de verdade");
console.log("  3. node scripts/quality-gate.mjs --strict");
console.log(`  4. git add ${relativo} && git commit`);
