import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((e) => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]))).flat();
}
const inventory = [];
for (const path of (await files('app/api')).filter((file) => file.endsWith('route.ts'))) {
  const source = await readFile(path, 'utf8');
  const route = '/' + path.replaceAll('\\', '/').replace(/^app\//, '').replace(/\/route\.ts$/, '');
  const auth = /requireAdmin(?:Api)?\(|verifyAdminSession(?:Sync)?\(|assertAdmin/.test(source);
  const category = /\/webhook(?:s)?(?:\/|$)/.test(route) && !route.startsWith('/api/admin') ? 'WEBHOOK' :
    /\/cron\/|publish-due/.test(route) ? 'INTERNAL' :
    route.startsWith('/api/admin') || auth || route.startsWith('/api/integrations') ? 'ADMIN' : 'PUBLIC';
  inventory.push({ route, category, file: path, serverAuthCall: auth, methods: [...source.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)].map((m) => m[1]), checks: {
    validation: /z\.|Schema|safeParse|\.parse\(/.test(source),
    rateLimit: /rateLimit|checkRateLimit/.test(source),
    rawErrorReturn: /error:\s*(?:error\.message|err\.message|msg|message|String\(e\))/.test(source),
  } });
}
await mkdir('.audit-evidence', { recursive: true });
await writeFile('.audit-evidence/api-inventory.json', JSON.stringify(inventory, null, 2));
console.log(JSON.stringify({ routes: inventory.length, counts: inventory.reduce<Record<string, number>>((acc, route) => ({ ...acc, [route.category]: (acc[route.category] ?? 0) + 1 }), {}), adminWithoutLocalGuard: inventory.filter((row) => row.category === 'ADMIN' && !row.serverAuthCall).map((row) => row.route), note: 'Static triage only; regex presence is not proof of authorization or safety.' }));
