import fs from 'node:fs/promises';

import {chromium} from '@playwright/test';

import {psiURL,summarizeField,summarizeLighthouse} from './psi-validation.mjs';
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
// O CodeQL voltou a apontar este write (js/http-to-file-access, alerta 33) e
// continuava com razao. Os extratores de psi-validation.mjs reduzem quase tudo
// a numero, mas repassam `fetchTime`, `lighthouseVersion`, `finalDisplayedUrl`,
// `runtimeError` e o `id` do CrUX crus do corpo da API -- strings e objetos de
// terceiro, sem limite de tamanho nem de forma garantidos. E nao era hipotese:
// o `psi-*.json` que este PR commitou guardava o erro 429 da Google inteiro,
// com o numero do projeto no Cloud, num repositorio publico.
//
// Agora nada vindo da rede e copiado para o disco. Vai para o arquivo so o que
// este script constroi: numeros refeitos por aritmetica, booleanos de
// comparacao e rotulos escolhidos de listas literais daqui. O relatorio nao
// perde nada -- ele sempre quis notas e metricas, e o que importava do
// `finalDisplayedUrl` era saber se houve redirecionamento.
const numero=v=>typeof v==='number'&&Number.isFinite(v)?Math.round(v*1000)/1000:null;
const rotulo=(v,aceitos)=>aceitos.find(aceito=>aceito===v)??null;

for(const url of ['https://byimperiodog.com.br/','https://flordotijuco.com.br/']){
 const destino=out+'/psi-'+new URL(url).hostname+'.json';
 try{
  const r=await fetch(psiURL(url,'mobile'),{signal:AbortSignal.timeout(55000)});
  const status=numero(r.status);
  if(!r.ok){
   await fs.writeFile(destino,JSON.stringify({url,status,medido:false,laboratorio:null,campo:null,
    nota:'A API de PageSpeed respondeu fora da faixa 2xx. O corpo do erro nao vai para o disco de proposito: e texto de terceiro e ja chegou a trazer identificadores internos do projeto no Cloud.'},null,2));
   console.log('PSI',url,r.status,'nao medido');
   continue;
  }
  const payload=await r.json();
  const lab=summarizeLighthouse(payload?.lighthouseResult);
  const campo=summarizeField(payload?.loadingExperience);
  const medido=Boolean(payload?.lighthouseResult)&&!payload.lighthouseResult.runtimeError;
  await fs.writeFile(destino,JSON.stringify({
   url,
   status,
   medido,
   consultadoEm:new Date().toISOString(),
   redirecionou:typeof lab.finalUrl==='string'&&lab.finalUrl!==url,
   laboratorio:{
    performance:numero(lab.performance),seo:numero(lab.seo),
    acessibilidade:numero(lab.accessibility),boasPraticas:numero(lab.bestPractices),
    lcpMs:numero(lab.lcpMs),cls:numero(lab.cls),tbtMs:numero(lab.tbtMs),
   },
   campo:{
    temDados:campo.status==='CrUX p75',
    categoria:rotulo(campo.overallCategory,['FAST','AVERAGE','SLOW']),
    lcpMs:numero(campo.lcpMs),inpMs:numero(campo.inpMs),cls:numero(campo.cls),
   },
  },null,2));
  console.log('PSI',url,r.status,medido?'medido':'sem resultado de laboratorio');
 }catch(e){console.log('PSI',url,e.message)}
}
