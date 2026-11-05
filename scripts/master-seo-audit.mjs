import fs from 'node:fs/promises';

const output = 'reports/master-seo-2026-11-03';
await fs.mkdir(output, { recursive: true });
const urls = [
  'https://byimperiodog.com.br/', 'https://byimperiodog.com.br/filhotes',
  'https://byimperiodog.com.br/spitz-alemao', 'https://byimperiodog.com.br/preco-spitz-anao',
  'https://byimperiodog.com.br/robots.txt', 'https://byimperiodog.com.br/sitemap.xml',
  'https://flordotijuco.com.br/', 'https://flordotijuco.com.br/sobre-a-raca/',
  'https://flordotijuco.com.br/filhotes-a-venda/', 'https://flordotijuco.com.br/duvidas-frequentes/',
  'https://flordotijuco.com.br/blog/', 'https://flordotijuco.com.br/robots.txt',
  'https://flordotijuco.com.br/sitemap_index.xml',
  'https://luludapomerania.com.br/', 'https://luludapomerania.com.br/filhotes-a-venda/',
  'https://luludapomerania.com.br/robots.txt', 'https://luludapomerania.com.br/sitemap_index.xml',
  'https://flordotijuco.com.br/wp-sitemap.xml', 'https://luludapomerania.com.br/wp-sitemap.xml',
  'https://flordotijuco.com.br/spitz-alemao-preto/',
  'https://flordotijuco.com.br/filhote-spitz-alemao-bad-bunny/',
  'https://flordotijuco.com.br/category/filhote-vendido/',
  'https://byimperiodog.com.br/contato', 'https://byimperiodog.com.br/faq-do-tutor',
];
const clean = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const attr = (s, name) => s.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] ?? null;
const results = [];
for (const url of urls) {
  try {
    const start = performance.now();
    const res = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'ByImperioDog-ReadOnlyAudit/1.0' } });
    const html = await res.text();
    const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]);
    const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({ href: m[1], label: clean(m[2]) }));
    results.push({ url, finalUrl: res.url, redirected: res.redirected, status: res.status,
      fetchMs: Math.round(performance.now() - start), bytes: Buffer.byteLength(html),
      title: clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''),
      description: attr(metas.find(m => attr(m, 'name') === 'description') ?? '', 'content'),
      robots: attr(metas.find(m => attr(m, 'name') === 'robots') ?? '', 'content'),
      canonical: attr([...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).find(m => attr(m, 'rel') === 'canonical') ?? '', 'href'),
      headings: [...html.matchAll(/<(h[123])\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => ({level:m[1],text:clean(m[2])})),
      schemaTypes: [...new Set([...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map(m=>m[1]))],
      images: [...html.matchAll(/<img\b[^>]*>/gi)].length,
      imagesWithoutAlt: [...html.matchAll(/<img\b[^>]*>/gi)].filter(m=>attr(m[0],'alt')===null).length,
      links: [...new Map(links.map(l=>[l.href,l])).values()],
      discovery: /\.(txt|xml)$/.test(url) ? html.slice(0, 50000) : undefined,
    });
  } catch (err) { results.push({url,error:err.message}); }
}
await fs.writeFile(`${output}/public-audit.json`, JSON.stringify({ checkedAt: new Date().toISOString(), note:'HTTP observations, not field CWV or indexing proof', results }, null, 2));
console.log(results.map(r=>({url:r.url,status:r.status,error:r.error,canonical:r.canonical,headings:r.headings?.length})));

const posts = [];
for (const name of await fs.readdir('content/posts')) {
  if (!name.endsWith('.mdx')) continue;
  const text = await fs.readFile(`content/posts/${name}`, 'utf8');
  posts.push({file:name,title:text.match(/^title:\s*(.*)$/m)?.[1],words:text.split(/\s+/).length,
    headings:[...text.matchAll(/^#{1,3}\s+(.+)$/gm)].map(m=>m[1]),
    links:[...text.matchAll(/\]\(([^)]+)\)/g)].map(m=>m[1]),
    reviewClaims:[...new Set([...text.matchAll(/.{0,45}(?:criador|criadora|cria[çc][ãa]o|hemograma|todo o Brasil|FCI|CBKC|garantia).{0,80}/gi)].map(m=>m[0]))]});
}
await fs.writeFile(`${output}/editorial-inventory.json`, JSON.stringify(posts,null,2));
if (results.some(r => r.error)) process.exitCode = 1;
