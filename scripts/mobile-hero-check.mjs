import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';
const base=process.env.CHECK_URL||'http://localhost:3104';
const out='reports/mobile-hero';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch();const results=[];
try{
 for(const width of [320,390,430,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname!==new URL(base).hostname||route.request().method()!=='GET'||/\/api\//.test(u.pathname)?route.abort():route.continue()});
  const page=await context.newPage();await page.goto(base,{waitUntil:'networkidle',timeout:120000});
  const reject=page.getByRole('button',{name:'Rejeitar',exact:true});if(await reject.count())await reject.click();
  const hero=page.locator('section[aria-labelledby="hero-heading"]');
  const photo=hero.locator('img[src*="spitz-hero-desktop"]');await expect.poll(()=>photo.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  const geometry=await photo.evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,fit:getComputedStyle(el).objectFit,ratio:el.naturalWidth/el.naturalHeight}});
  if(width<640){assert.equal(geometry.fit,'contain');assert(Math.abs(geometry.width/geometry.height-geometry.ratio)<0.01);const heading=await page.locator('#hero-heading').boundingBox();const image=await photo.boundingBox();assert(heading.y>=image.y+image.height);}
  else assert.equal(geometry.fit,'cover');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await expect(hero.locator('[data-google-review-summary="compact"]')).toHaveCount(0);
  if(width===390||width===1440)await hero.screenshot({path:`${out}/hero-${width}.png`});
  results.push({width,...geometry,overflow:false});await context.close();
 }
 await fs.writeFile(`${out}/validation.json`,JSON.stringify({base,results},null,2));console.log(results);
}finally{await browser.close()}
