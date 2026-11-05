import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {chromium,expect} from '@playwright/test';
const base=process.env.CHECK_URL||'http://localhost:3104';
const out='reports/album-reviews';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch();const results=[];
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname!==new URL(base).hostname||route.request().method()!=='GET'||/\/api\//.test(u.pathname)?route.abort():route.continue()});
  const page=await context.newPage();await page.goto(base,{waitUntil:'networkidle',timeout:120000});
  const reject=page.getByRole('button',{name:'Rejeitar',exact:true});if(await reject.count())await reject.click();
  await expect(page.locator('[data-google-review-summary="compact"]')).toHaveCount(0);
  // Carrega as seções adiadas naturalmente, sem mudar seus estilos.
  for(let y=0;y<await page.evaluate(()=>document.documentElement.scrollHeight);y+=650){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(60);}
  const album=page.getByRole('region',{name:'Álbum das famílias',exact:true});await expect(album).toBeVisible();
  const reviews=page.locator('section[aria-labelledby="family-stories-heading"]');await expect(reviews).toHaveCount(1);
  await expect(reviews.locator('[data-review-source="google"]')).toHaveCount(33);
  await expect(reviews).toContainText('35 avaliações no Google');
  const photo=album.locator('img[src*="emily-pompom"]');await expect(photo).toHaveCount(1);await photo.scrollIntoViewIfNeeded();await expect.poll(()=>photo.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  await expect(album).toContainText('Emily e PomPom');await expect(album).toContainText('São José dos Campos, SP');
  const positions=await page.evaluate(()=>{const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top+scrollY,bottom:r.bottom+scrollY}};return {album:rect(document.querySelector('section[aria-label="Álbum das famílias"]')),reviews:rect(document.querySelector('section[aria-labelledby="family-stories-heading"]'))}});
  assert(positions.reviews.top>=positions.album.bottom);assert(positions.reviews.top-positions.album.bottom<30);
  await photo.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.addStyleTag({content:'nextjs-portal {display:none!important}'});
  await album.screenshot({path:`${out}/album-${width}.png`});await reviews.screenshot({path:`${out}/reviews-${width}.png`});
  await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
  const violations=await page.evaluate(async()=>{const r=await window.axe.run({include:['section[aria-label="Álbum das famílias"]','section[aria-labelledby="family-stories-heading"]']},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});assert.deepEqual(violations,[]);
  results.push({width,positions,heroSummary:0,albumPhoto:'loaded; opens and closes',googleCards:33,overflow:false,violations});await context.close();
 }
 await fs.writeFile(`${out}/${base.includes('localhost')?'local':'live'}-validation.json`,JSON.stringify({base,results},null,2));console.log(results);
}finally{await browser.close()}
