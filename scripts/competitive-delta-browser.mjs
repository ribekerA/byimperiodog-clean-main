import fs from 'node:fs/promises';

import {chromium} from '@playwright/test';
const out='reports/competitive-delta-2026-11-03';const results=[];const b=await chromium.launch();
try{for(const url of ['https://byimperiodog.com.br/','https://byimperiodog.com.br/filhotes','https://byimperiodog.com.br/filhotes/spitz-alemao-anao-branco-femea','https://flordotijuco.com.br/']){
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});
 await p.route('**/*',r=>{const u=new URL(r.request().url());return r.request().method()!=='GET'||/google-analytics|googletagmanager|doubleclick|facebook\.net|googleadservices|\/api\/(analytics|rum|leads|media-likes)/.test(u.href)?r.abort():r.continue()});
 try{const r=await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await p.waitForTimeout(2500);const reject=p.getByRole('button',{name:'Rejeitar',exact:true});if(await reject.count())await reject.click();
 for(let i=0;i<35;i++){const done=await p.evaluate(()=>{window.scrollBy(0,650);return scrollY+innerHeight>=document.documentElement.scrollHeight-5});await p.waitForTimeout(100);if(done)break;}
 const data=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,height:document.documentElement.scrollHeight,headings:[...document.querySelectorAll('h2')].map(e=>({text:e.textContent,y:Math.round(e.getBoundingClientRect().top+scrollY)})),googleCards:document.querySelectorAll('[data-review-source="google"]').length,googleSummary:/35 avaliações no Google/.test(document.body.innerText),waLinks:[...document.querySelectorAll('a[href*="wa.me"]')].map(e=>({href:e.href,text:e.textContent.trim()})),navigation:performance.getEntriesByType('navigation').map(n=>({responseStart:n.responseStart,domContentLoaded:n.domContentLoadedEventEnd}))}));
 results.push({url,status:r.status(),...data});await p.screenshot({path:out+'/'+new URL(url).hostname+'-'+(new URL(url).pathname.replaceAll('/','_')||'home')+'.png'});
 }catch(e){results.push({url,error:e.message})}await p.close();
}await fs.writeFile(out+'/mobile-browser.json',JSON.stringify({note:'One mobile simulated session. Analytics blocked; not a Lighthouse or field CWV score. No outbound WhatsApp clicks or forms submitted.',results},null,2));}finally{await b.close()}
for(const url of ['https://byimperiodog.com.br/','https://flordotijuco.com.br/']){try{const r=await fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&url='+encodeURIComponent(url),{signal:AbortSignal.timeout(55000)});const json=await r.json();await fs.writeFile(out+'/psi-'+new URL(url).hostname+'.json',JSON.stringify({url,status:r.status,json},null,2));console.log('PSI',url,r.status)}catch(e){console.log('PSI',url,e.message)}}
