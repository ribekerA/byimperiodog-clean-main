import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const out = 'reports/competitive-delta-2026-11-03';
await fs.mkdir(out, {recursive:true});
const by='https://byimperiodog.com.br', flor='https://flordotijuco.com.br', lulu='https://luludapomerania.com.br';
const urls=process.argv.includes('--extra') ? [by+'/termos-de-uso',by+'/blog/documentacao-registro-spitz-alemao',by+'/sitemap-index.xml',by+'/sitemaps/posts.xml',by+'/sitemaps/images.xml',by+'/sitemaps/videos.xml',flor+'/somos-o-flor-do-tijuco/',flor+'/blog/'] : [
 ...['/','/filhotes','/spitz-alemao','/lulu-da-pomerania','/preco-spitz-anao','/filhotes/sao-paulo','/lulu-da-pomerania-braganca-paulista','/spitz-alemao-preto','/spitz-alemao-branco','/filhotes/cor/laranja','/filhotes/cor/preto','/filhotes/spitz-alemao-anao-branco-femea','/filhotes/spitz-alemao-anao-preto-femea','/comprar-spitz-anao','/reserve-seu-filhote','/faq-do-tutor','/sobre','/contato','/blog/preco-spitz-alemao-anao','/blog/cores-spitz-alemao-anao-qual-mais-cara','/robots.txt','/sitemap.xml','/llms.txt'].map(p=>by+p),
 ...['/','/sobre-a-raca/','/o-canil/','/filhotes-a-venda/','/duvidas-frequentes/','/spitz-alemao-preto/','/filhote-spitz-alemao-bad-bunny/','/category/filhote-vendido/','/contato/','/robots.txt','/wp-sitemap.xml'].map(p=>flor+p),
 ...['/','/filhotes-a-venda/','/contato/','/robots.txt','/wp-sitemap.xml'].map(p=>lulu+p)
];
const results=[];
for(let i=0;i<urls.length;i+=3){await Promise.all(urls.slice(i,i+3).map(async url=>{
 try{
 const start=Date.now();const r=await fetch(url,{signal:AbortSignal.timeout(25000),headers:{'User-Agent':'PublicReadOnlyAudit/1.0'}});const html=await r.text();
 const dom=new JSDOM(html,{url:r.url});const d=dom.window.document;
 const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].map(s=>{try{return JSON.parse(s.textContent)}catch{return {invalid:true}}});
 d.querySelectorAll('script,style,noscript').forEach(e=>e.remove());
 const text=d.body.textContent.replace(/\s+/g,' ').trim();
 const result={url,finalUrl:r.url,status:r.status,checkedAt:new Date().toISOString(),fetchMs:Date.now()-start,bytes:Buffer.byteLength(html),title:d.title,canonical:d.querySelector('link[rel="canonical"]')?.href,robots:d.querySelector('meta[name="robots"]')?.content,xRobots:r.headers.get('x-robots-tag'),headings:[...d.querySelectorAll('h1,h2,h3')].map(e=>({level:e.tagName,text:e.textContent.trim()})),schemas,links:[...new Map([...d.querySelectorAll('a[href]')].map(a=>[a.href,{href:a.href,text:a.textContent.trim()}])).values()],images:[...d.querySelectorAll('img')].map(e=>({src:e.getAttribute('src'),alt:e.getAttribute('alt')})),videos:[...d.querySelectorAll('video,iframe')].map(e=>e.getAttribute('src')),text};
 results.push(result);console.log(r.status,url);dom.window.close();
 }catch(e){results.push({url,error:e.message});console.log('ERROR',url,e.message)}
 }));}
const byPages=results.filter(r=>r.url.startsWith(by)&&r.status===200);
const depths=new Map([[by+'/',0]]);for(let i=0;i<8;i++)for(const page of byPages){const depth=depths.get(page.finalUrl);if(depth===undefined)continue;for(const link of page.links){const u=new URL(link.href);u.hash='';u.search='';const key=u.href;if(!depths.has(key))depths.set(key,depth+1)}}
await fs.writeFile(out+(process.argv.includes('--extra')?'/public-extra.json':'/public-current.json'),JSON.stringify({note:'Fresh HTTP sample; not ranking, indexing or field CWV. Depth is an upper bound in the sampled graph; missing depth is not proof of orphan page.',results,depths:Object.fromEntries(depths)},null,2));
