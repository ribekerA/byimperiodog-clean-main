import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';

import { chromium, expect } from '@playwright/test';

const out='reports/reviews-position';
const base='http://localhost:3104';
const protectedFiles=['src/domain/pricing.ts','content/puppies-static.ts','src/lib/whatsapp.ts','src/lib/structured-data.ts','src/lib/seo.ts','content/home-faq-items.ts'];
for(const file of protectedFiles) assert.equal(await fs.readFile(file,'utf8'),execFileSync('git',['show',`HEAD:${file}`],{encoding:'utf8'}),file);
const results=[];const browser=await chromium.launch();
try {
 for(const width of [1440,390,768,1920]) {
  const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390,reducedMotion:'reduce'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname!=='localhost'||route.request().method()!=='GET'||/\/api\/(rum|analytics|leads|media-likes)/.test(u.pathname)?route.abort():route.continue()});
  const page=await context.newPage();
  await page.goto(base,{waitUntil:'networkidle',timeout:120000});
  const reject=page.getByRole('button',{name:'Rejeitar',exact:true});if(await reject.count())await reject.click();
  await page.evaluate(()=>document.fonts.ready);
  const summary=page.locator('[data-google-review-summary="compact"]');
  const reviews=page.locator('section[aria-labelledby="family-stories-heading"]');
  const diff=page.locator('section[aria-labelledby="diff-heading"]');
  const catalog=page.locator('section[aria-labelledby="featured-heading"]');
  await expect(summary).toHaveCount(1);await expect(reviews).toHaveCount(1);
  await expect(reviews.locator('[data-review-source="google"]')).toHaveCount(33);
  await expect(reviews.locator('li')).toHaveCount(48);
  await expect(summary).toContainText('4,9 / 5');await expect(summary).toContainText('35 avaliações no Google');
  await expect(summary.getByRole('link',{name:/Conferir no Google/})).toHaveAttribute('href','https://search.google.com/local/reviews?placeid=ChIJFwqx2DTLzpQRPZ-1dMMPGkA');
  const nearCTA=await summary.evaluate(el=>{const cta=document.querySelector('[data-wa-placement="hero"]');return el.getBoundingClientRect().top-cta.getBoundingClientRect().bottom});
  assert(nearCTA>=0 && nearCTA<160,`summary gap ${nearCTA}`);
  // Render naturally deferred sections before measuring the whole page.
  for(let i=0;i<40;i++){const done=await page.evaluate(()=>{scrollBy(0,850);return scrollY+innerHeight>=document.documentElement.scrollHeight-3});await page.waitForTimeout(40);if(done)break;}
  await reviews.scrollIntoViewIfNeeded();
  const positions=await page.evaluate(()=>{const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top+scrollY,bottom:r.bottom+scrollY}};return {diff:box('[aria-labelledby="diff-heading"]'),reviews:box('[aria-labelledby="family-stories-heading"]'),catalog:box('[aria-labelledby="featured-heading"]'),height:document.documentElement.scrollHeight}});
  assert(positions.diff.bottom<=positions.reviews.top+2);
  assert(positions.reviews.bottom<=positions.catalog.top+2);
  if(width===390)assert(positions.reviews.bottom<positions.height/2,'whole reviews section before midpoint');
  const list=reviews.getByRole('list');
  const visible=await list.evaluate(el=>{const r=el.getBoundingClientRect();return [...el.children].filter(c=>{const b=c.getBoundingClientRect();return Math.min(b.right,r.right)-Math.max(b.left,r.left)>2}).length});
  assert.equal(visible,width===390?1:width>=1280?3:2);
  await reviews.getByRole('button',{name:'Próximo depoimento'}).click();await expect.poll(()=>list.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  await reviews.getByRole('button',{name:'Depoimento anterior'}).click();await expect.poll(()=>list.evaluate(el=>el.scrollLeft)).toBeLessThan(2);
  let touch='not applicable';
  if(width===390){const box=await list.boundingBox();const cdp=await context.newCDPSession(page);const y=Math.max(10,Math.min(950,box.y+80));const x=box.x+box.width-25;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-i*30,y}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await expect.poll(()=>list.evaluate(el=>el.scrollLeft)).toBeGreaterThan(30);touch='passed';
   await reviews.getByRole('button',{name:'Depoimento anterior'}).click();await expect.poll(()=>list.evaluate(el=>el.scrollLeft)).toBeLessThan(2);
  }
  await list.focus();await page.keyboard.press('ArrowRight');await expect.poll(()=>list.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  await list.evaluate(el=>el.scrollTo({left:0,behavior:'instant'}));
  const expand=list.locator('li[data-review-source="google"]').first().getByRole('button');await expand.click();await expect(expand).toHaveAttribute('aria-expanded','true');await expand.click();
  await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
  const violations=await page.evaluate(async()=>{const r=await window.axe.run({include:['[data-google-review-summary="compact"]','section[aria-labelledby="family-stories-heading"]']},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});assert.deepEqual(violations,[]);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);
  await page.addStyleTag({content:'nextjs-portal {display:none !important}'});
  if(width===1440||width===390){
   // Hide the fixed navigation only for section captures, after all checks.
   const captureStyle=await page.addStyleTag({content:'header, a[href="#conteudo-principal"] {visibility:hidden !important}'});
   await reviews.screenshot({path:`${out}/reviews-${width}.png`});
   await diff.screenshot({path:`${out}/presentation-${width}.png`});
   await captureStyle.evaluate(el=>el.remove());
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`${out}/hero-${width}.png`});
   await page.screenshot({path:`${out}/position-${width}.png`,fullPage:true,clip:{x:0,y:0,width,height:Math.ceil(positions.catalog.top+250)}});
  }
  // Preserve published individual prices from main.
  await expect(catalog).toContainText('R$ 7.500');await expect(catalog).toContainText('R$ 9.500');
  results.push({width,visible,nearCTA,positions,overflow,touch,keyboard:'passed',arrows:'passed',violations,googleCards:33,allCards:48});await context.close();
 }
 await fs.writeFile(`${out}/browser-validation.json`,JSON.stringify({protectedFiles,results},null,2));console.log(results);
} finally {await browser.close()}
