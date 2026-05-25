#!/usr/bin/env node
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Walk up the directory tree from multiple start points and check common locations for the real script.
function findScriptUpwardsFrom(startDir, maxLevels = 8, attempted = []) {
  let dir = startDir;
  for (let level = 0; level <= maxLevels; level++) {
    const checks = [
      resolve(dir, 'scripts', 'gen-client-photos.mjs'),
      resolve(dir, 'gen-client-photos.mjs'),
    ];
    for (const c of checks) {
      attempted.push(c);
      if (existsSync(c)) return { found: c, attempted };
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return { found: null, attempted };
}

// Candidate start points: script's own dir, current working dir, and Vercel standard roots
const starts = [__dirname, process.cwd(), resolve('/vercel/path0'), resolve('/vercel')];
let found = null;
let attemptedPaths = [];
for (const s of starts) {
  try {
    const { found: f, attempted } = findScriptUpwardsFrom(s, 10, []);
    attemptedPaths = attemptedPaths.concat(attempted);
    if (f) {
      found = f;
      break;
    }
  } catch (err) {
    // ignore and continue
  }
}

if (!found) {
  console.error('gen-client-photos.mjs not found in expected locations. Looked at:');
  // Print a subset to avoid giant logs
  const unique = Array.from(new Set(attemptedPaths)).slice(0, 200);
  for (const p of unique) console.error(' - ' + p);
  console.warn('Skipping gen-client-photos prebuild step (non-fatal).');
  // Do not fail the build if the helper script is absent
  process.exit(0);
}

console.log('Found gen-client-photos at', found);
const res = spawnSync(process.execPath, [found, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(res.status ?? 0);
