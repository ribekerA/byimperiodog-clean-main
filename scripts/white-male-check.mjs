import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {chromium,expect} from '@playwright/test';
const base=process.env.CHECK_URL||'http://localhost:3104';
const slug='spitz-alemao-anao-branco-macho';const out='reports/white-male-20261105';
const browser=await chromium.launch();const results=[];
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname!==new URL(base).hostname||route.request().method()!=='GET'||/\/api\//.test(u.pathname)?route.abort():route.continue()});
  const page=await context.newPage();
  assert.equal((await page.goto(`${base}/filhotes/${slug}`,{waitUntil:'networkidle',timeout:120000})).status(),200);
  const reject=page.getByRole('button',{name:'Rejeitar',exact:true});if(await reject.count())await reject.click();
  await expect(page.getByRole('heading',{level:1})).toContainText('Branco');
  await expect(page.locator('[aria-label="Preço: R$ 4.500"]')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',`https://byimperiodog.com.br/filhotes/${slug}`);
  const thumbs=page.getByRole('button',{name:/^Ver foto \d+$/});await expect(thumbs).toHaveCount(11);
  await page.getByRole('button',{name:'Ver foto 11',exact:true}).click();
  const selected=page.locator('img[src*="branco-macho-20261105-11.jpg"]').first();await expect.poll(()=>selected.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  await page.getByRole('button',{name:'Ver foto 1',exact:true}).click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.evaluate(()=>scrollTo(0,0));await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await page.screenshot({path:`${out}/${base.includes('localhost')?'local':'live'}-detail-${width}.png`});
  await page.goto(`${base}/filhotes`,{waitUntil:'networkidle',timeout:120000});
  await page.getByLabel('O que você procura?',{exact:true}).fill('macho branco até 4500');
  const cards=page.locator('article').filter({has:page.locator(`[data-wa-puppy="${slug}"]`)});await expect(cards).toHaveCount(1);await expect(cards).toContainText('R$ 4.500');
  await expect(page.locator('#catalog-query-result')).toContainText('1 referência');
  const wa=await cards.locator('[data-wa-puppy]').getAttribute('href');assert(wa.startsWith('https://wa.me/5511968633239'));
  await cards.scrollIntoViewIfNeeded();await cards.screenshot({path:`${out}/${base.includes('localhost')?'local':'live'}-card-${width}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  results.push({width,price:4500,photos:11,detail:200,catalogSearch:'passed',whatsapp:'href checked; not clicked',overflow:false});await context.close();
 }
 await fs.writeFile(`${out}/${base.includes('localhost')?'local':'live'}-validation.json`,JSON.stringify({base,results},null,2));console.log(results);
}finally{await browser.close()}
