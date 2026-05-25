#!/usr/bin/env node
/* eslint-disable no-console */
/*
 Verifica headers de cache em produção.
 Uso:
   npm run cache:verify -- --url=https://seu-dominio.vercel.app

 Validações:
  - /spitz-hero-desktop.webp: Cache-Control public, max-age>=31536000, immutable
  - /_next/image?url=%2Fspitz-hero-desktop.webp&w=1080&q=75: Cache-Control public, max-age>=604800

 Obs.: Requer Node >=20 (fetch nativo). Não falha hard: retorna código 0 e imprime FAIL/OK por item.
*/

const argUrl = process.argv.find(a => a.startsWith('--url='));
const baseUrl = argUrl ? argUrl.split('=')[1] : process.env.PRODUCTION_BASE_URL;

if (!baseUrl) {
  console.log('Uso: npm run cache:verify -- --url=https://seu-dominio.vercel.app');
  process.exit(0);
}

function joinUrl(path) {
  return baseUrl.replace(/\/$/, '') + path;
}

function hasImmutable(cacheControl) {
  return /immutable/i.test(cacheControl || '');
}

function parseMaxAge(cacheControl) {
  const m = /max-age=(\d+)/i.exec(cacheControl || '');
  return m ? parseInt(m[1], 10) : 0;
}

async function check(url, { minMaxAge = 0, requireImmutable = false } = {}) {
  try {
    const res = await fetch(url, { method: 'GET' });
    const cc = res.headers.get('cache-control') || '';
    const maxAge = parseMaxAge(cc);
    const immutable = hasImmutable(cc);
    const okAge = maxAge >= minMaxAge;
    const okImmutable = !requireImmutable || immutable;
    const passed = res.ok && okAge && okImmutable;

    console.log(`${passed ? 'OK  ' : 'FAIL'} ${url}`);
    console.log(`      status=${res.status} cache-control=${cc || '-'} (max-age=${maxAge}, immutable=${immutable})`);
    if (!passed) {
      if (!res.ok) console.log('      motivo: resposta não OK');
      if (!okAge) console.log(`      motivo: max-age menor que ${minMaxAge}`);
      if (!okImmutable && requireImmutable) console.log('      motivo: immutable ausente');
    }
    return passed;
  } catch (e) {
    console.log(`FAIL ${url}`);
    console.log('      erro:', e.message);
    return false;
  }
}

(async () => {
  const checks = [];

  // Asset estático direto da pasta public
  checks.push(await check(joinUrl('/spitz-hero-desktop.webp'), { minMaxAge: 31536000, requireImmutable: true }));

  // Rota de image optimization do Next (ajuste w conforme devices)
  checks.push(await check(joinUrl('/_next/image?url=%2Fspitz-hero-desktop.webp&w=1080&q=75'), { minMaxAge: 604800 }));

  // Página HTML não deve ter cache longo (apenas informativo)
  try {
    const url = joinUrl('/');
    const res = await fetch(url);
    const cc = res.headers.get('cache-control') || '';
    console.log(`INFO ${url}`);
    console.log(`      status=${res.status} cache-control=${cc || '-'}`);
  } catch (e) {
    console.log('INFO / erro ao obter HTML:', e.message);
  }

  const passedAll = checks.every(Boolean);
  console.log(`\nResumo: ${passedAll ? 'TODOS PASSARAM' : 'FALHAS DETECTADAS (ver acima)'}`);
  process.exit(0); // não quebra pipeline por padrão
})();
