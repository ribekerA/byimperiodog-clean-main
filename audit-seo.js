const fs = require('fs');
const pages = [
  'app/page.tsx',
  'app/spitz-alemao/page.tsx',
  'app/lulu-da-pomerania/page.tsx',
  'app/preco-spitz-anao/page.tsx',
  'app/comprar-spitz-anao/page.tsx',
  'app/filhote-de-spitz-alemao/page.tsx',
  'app/criador-spitz-confiavel/page.tsx',
  'app/spitz-alemao-baby-face/page.tsx',
  'app/spitz-alemao-preto/page.tsx',
  'app/lulu-da-pomerania-braganca-paulista/page.tsx',
  'app/canil-spitz-alemao-interior-sp/page.tsx',
];
for (const p of pages) {
  try {
    const c = fs.readFileSync(p, 'utf8');
    const titleMatch = c.match(/title:\s*"([^"]{0,120})/);
    const descMatch = c.match(/description:\s*\n?\s*"([^"]{0,140})/);
    const route = p.replace('app/', '/').replace('/page.tsx','') || '/';
    console.log('--- ' + route + ' ---');
    if (titleMatch) console.log('  T: ' + titleMatch[1]);
    if (descMatch) console.log('  D: ' + descMatch[1].substring(0,120));
    // keywords
    const kwMatch = c.match(/keywords:\s*\[([\s\S]{0,500}?)\]/);
    if (kwMatch) {
      const kws = kwMatch[1].replace(/[\n\r\t]/g,'').replace(/\s+/g,' ').replace(/[,"]+/g,' | ').substring(0,200).trim();
      console.log('  K: ' + kws);
    }
    // check if Lulu mentioned
    const hasLulu = c.includes('Lulu da Pomer') || c.includes('lulu-da-pomer');
    const hasSpitz = c.includes('Spitz Alem') || c.includes('spitz-alem');
    const hasPomeranian = c.includes('Pomeranian') || c.includes('pomeranian');
    console.log('  Tags: Lulu=' + hasLulu + ' Spitz=' + hasSpitz + ' Pomeranian=' + hasPomeranian);
  } catch (e) { console.log('  MISSING: ' + p); }
}
