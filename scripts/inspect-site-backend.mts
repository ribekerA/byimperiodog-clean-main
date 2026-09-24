import nextEnv from '@next/env';
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

const source = process.argv[2];
if (!source) throw new Error('Pass the project env directory; no credentials should be pasted');
nextEnv.loadEnvConfig(source, true, { info() {}, error() {} });
if (process.argv[3]) {
  const extra = parseEnv(await readFile(process.argv[3], 'utf8'));
  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ACCESS_TOKEN', 'SUPABASE_DB_URL', 'DATABASE_URL', 'NETLIFY_AUTH_TOKEN', 'NETLIFY_API_TOKEN', 'MEDIA_LIKES_SECRET']) {
    if (extra[name]) process.env[name] = extra[name];
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log(JSON.stringify({ configured: {
  supabaseUrl: Boolean(url), supabaseService: Boolean(key),
  supabaseManagement: Boolean(process.env.SUPABASE_ACCESS_TOKEN),
  databaseUrl: Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL),
  netlify: Boolean(process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_API_TOKEN),
  mediaLikesSecret: Boolean(process.env.MEDIA_LIKES_SECRET),
} }));
if (!url || !key) process.exit(1);
if (new URL(url).hostname !== 'npmnuihgydadihktglrd.supabase.co') throw new Error('Unexpected project; no request made');
const headers = { apikey: key, Authorization: `Bearer ${key}` };
for (const [name, path] of [
  ['leadClickColumns', '/rest/v1/leads?select=id,gclid,wbraid,gbraid&limit=0'],
  ['leadExistingColumns', '/rest/v1/leads?select=id,gclid,notes&limit=0'],
  ['mediaLikesTable', '/rest/v1/media_likes?select=media_id&limit=0'],
  ['mediaLikesCount', '/rest/v1/rpc/media_likes_contagem?ids=%7Bgallery%3Aspitz-branco%7D'],
]) {
  const response = await fetch(url + path, { headers });
  const data = await response.json().catch(() => null);
  console.log(JSON.stringify({ check: name, status: response.status, code: data?.code, message: response.ok ? 'OK' : data?.message }));
}
