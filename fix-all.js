const fs = require('fs');
const path = require('path');

const cp1252map = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F,
};

function fixMojibake(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const cp = str.charCodeAt(i);
    if (cp < 128) bytes.push(cp);
    else if (cp1252map[cp] !== undefined) bytes.push(cp1252map[cp]);
    else if (cp <= 0xFF) bytes.push(cp);
    else bytes.push(0x3F);
  }
  const result = Buffer.from(bytes).toString('utf8');
  // Replace FFFD (invalid bytes → replacement chars) with ASCII double quotes
  let final = '';
  for (let i = 0; i < result.length; i++) {
    final += result.charCodeAt(i) === 0xFFFD ? '"' : result[i];
  }
  return final;
}

function hasMojibake(content) {
  for (let i = 0; i < content.length - 1; i++) {
    if (content.charCodeAt(i) === 0xC3 && content.charCodeAt(i+1) >= 0x80 && content.charCodeAt(i+1) <= 0xFF) return true;
  }
  return false;
}

function walkSync(dir, results = []) {
  let items;
  try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const item of items) {
    if (['node_modules', '.next', '.git'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walkSync(full, results);
    else if (/\.(tsx|ts|jsx|js|mdx|md)$/.test(item.name)) results.push(full);
  }
  return results;
}

const files = walkSync('.');
let fixed = 0;
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  if (!hasMojibake(content)) continue;
  const fixedContent = fixMojibake(content).replace(/^\?/, '');
  if (fixedContent !== content) {
    fs.writeFileSync(f, fixedContent, 'utf8');
    fixed++;
    console.log('FIXED:', path.relative('.', f));
  }
}
console.log('\nDone. Fixed:', fixed, 'files');
