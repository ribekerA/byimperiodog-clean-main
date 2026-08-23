/**
 * Gera src/lib/_generated-posts.ts com todos os posts MDX.
 * Executa antes do next dev/build e não depende do Contentlayer legado.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.join(__dirname, '..');
const postsDir  = path.join(root, 'content', 'posts');

// Inline frontmatter parser — sem dependência externa
function parseFrontmatter(src) {
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, content: src };
  const yamlStr = match[1];
  const content = src.slice(match[0].length).trimStart();
  const data    = {};

  for (const line of yamlStr.split(/\r?\n/)) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, raw] = kv;
    const val = raw.trim();

    if (val.startsWith("'") || val.startsWith('"')) {
      data[key] = val.slice(1, -1);
    } else if (val === 'true') {
      data[key] = true;
    } else if (val === 'false') {
      data[key] = false;
    } else if (!isNaN(Number(val)) && val !== '') {
      data[key] = Number(val);
    } else if (val === '') {
      // Array — próximas linhas com "  - item"
      data[key] = [];
    } else {
      data[key] = val;
    }
  }

  // Parse arrays (simples, items com "  - ")
  const arrayRe = /^(\w[\w-]*):\s*\n((?:\s+-\s+.+\n?)+)/gm;
  let m;
  while ((m = arrayRe.exec(yamlStr)) !== null) {
    const arrKey = m[1];
    const items  = m[2].match(/\s+-\s+(.+)/g)?.map((l) => l.replace(/\s+-\s+/, '').trim()) ?? [];
    data[arrKey] = items;
  }

  return { data, content };
}

function estimateReadingTime(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function buildPost(filename) {
  const slug = filename.replace(/\.mdx$/, '');
  // Normaliza CRLF -> LF na leitura. O `bodyRaw` gerado aqui é serializado com
  // JSON.stringify, então cada \r do Windows (core.autocrlf=true) virava um
  // escape "\\r" literal dentro do artefato: rodar o gerador no Windows produzia
  // ~2.3 mil escapes a mais que na Netlify, cujo checkout é LF. O arquivo
  // divergia conforme a máquina que rodasse o prebuild, poluindo o diff sem
  // nenhuma mudança de conteúdo. Com LF nas duas pontas a saída é idêntica.
  const raw  = fs.readFileSync(path.join(postsDir, filename), 'utf-8').replace(/\r\n/g, '\n');
  const { data, content } = parseFrontmatter(raw);

  return {
    slug,
    title:       data.title       ?? slug,
    // `seo_title` existe para encurtar o <title> sem mexer no H1 do artigo:
    // vários títulos passavam de 100 caracteres com o sufixo da marca e o
    // Google cortava o fim na busca. Opcional — sem ele vale o `title`.
    seoTitle:    data.seo_title   ?? null,
    description: data.description ?? null,
    excerpt:     data.description ?? null,
    cover:       data.cover       ?? null,
    // O fallback `new Date()` aqui é a última linha de defesa, não o normal:
    // um artigo sem `date` receberia o horário do build e sairia no sitemap e
    // no datePublished do schema como publicado "agora", mudando a cada deploy.
    // scripts/quality-gate.mjs reprova artigo sem `date` antes de chegar aqui.
    date:        data.date        ? new Date(String(data.date)).toISOString() : new Date().toISOString(),
    updated:     data.updated     ? new Date(String(data.updated)).toISOString() : null,
    tags:        Array.isArray(data.tags) ? data.tags : null,
    category:    data.category    ?? null,
    author:      data.author      ?? null,
    readingTime: estimateReadingTime(content),
    url:         `/blog/${slug}`,
    bodyRaw:     content,

    // ─── Camada de conteúdo escalável ─────────────────────────────────────
    // Campos OPCIONAIS. Nenhum artigo de hoje os declara e nenhum passa a ser
    // obrigatório: eles existem para que a página nova nasça com a decisão
    // editorial registrada no próprio arquivo, em vez de na cabeça de quem
    // escreveu. É o que scripts/quality-gate.mjs lê para reprovar página sem
    // demanda comprovada, sem objetivo de conversão e canibalizando outra.
    //
    // Sem eles o artigo continua publicando igual — a engine é opt-in. O que
    // muda é que, a partir daqui, dá para exigir os campos em conteúdo NOVO
    // sem reescrever os 30 artigos existentes.
    searchIntent:        data.search_intent        ?? null, // informational | commercial | transactional | navigational
    commercialIntent:    data.commercial_intent    ?? null, // low | medium | high
    primaryTopic:        data.primary_topic        ?? null,
    secondaryTopics:     Array.isArray(data.secondary_topics)   ? data.secondary_topics   : null,
    targetQuery:         data.target_query         ?? null,
    supportingQueries:   Array.isArray(data.supporting_queries) ? data.supporting_queries : null,
    // Demanda: de ONDE veio a evidência e QUANDO foi medida. Sem volume
    // inventado — a fonte pode ser Search Console, sugestão do Google ou
    // pergunta recorrente no WhatsApp, desde que fique escrito qual foi.
    searchDemandSource:  data.search_demand_source ?? null,
    searchDemandDate:    data.search_demand_date   ?? null,
    // Autoria e checagem. `reviewer` só se existir revisor de verdade.
    reviewer:            data.reviewer             ?? null,
    sources:             Array.isArray(data.sources) ? data.sources : null,
    // Publicação e indexação
    status:              data.status               ?? 'published',
    canonical:           data.canonical            ?? null,
    robots:              data.robots               ?? null,
    schemaType:          data.schema_type          ?? null,
    // Conversão e grafo interno
    conversionGoal:      data.conversion_goal      ?? null,
    relatedCommercialPage: data.related_commercial_page ?? null,
    cannibalizationRisk: data.cannibalization_risk ?? null,
  };
}

function main() {
  if (!fs.existsSync(postsDir)) {
    console.log('[gen-contentlayer] posts dir not found, skipping');
    return;
  }

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.mdx'));
  const posts = files.map(buildPost);

  // Sort by date desc
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const json = JSON.stringify(posts, null, 2);

  // TypeScript — importado diretamente pelo Next, sem alias de bundler.
  const tsOutDir = path.join(root, 'src', 'lib');
  fs.writeFileSync(
    path.join(tsOutDir, '_generated-posts.ts'),
    `// AUTO-GENERATED by scripts/gen-contentlayer.mjs — não edite manualmente\n// Execute: node scripts/gen-contentlayer.mjs\nexport const generatedPosts = ${json} as const;\n`,
  );

  console.log(`[gen-contentlayer] Generated ${posts.length} posts → src/lib/_generated-posts.ts`);
}

main();
