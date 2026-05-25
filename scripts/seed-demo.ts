#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
	try {
		const envPath = path.join(process.cwd(), '.env.local');
		if (fs.existsSync(envPath)) {
			const raw = fs.readFileSync(envPath, 'utf8');
			for (const line of raw.split(/\r?\n/)) {
				const t = line.trim();
				if (!t || t.startsWith('#')) continue;
				const idx = t.indexOf('=');
				if (idx <= 0) continue;
				const key = t.slice(0, idx).trim();
				let val = t.slice(idx + 1).trim();
				if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
					val = val.slice(1, -1);
				}
				if (!process.env[key]) process.env[key] = val;
			}
			console.log('[seed] .env.local loaded');
		}
	} catch (e) {
		console.warn('[seed] Failed to load .env.local:', (e as any)?.message || e);
	}
}

async function seedContentLayer() {
	const postPath = path.join(process.cwd(), 'content', 'posts');
	if (!fs.existsSync(postPath)) fs.mkdirSync(postPath, { recursive: true });
	console.log('Seed contentlayer demo: OK');
}

async function seedPuppies() {
	loadEnvLocal();
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		console.log('[seed:puppies] Skipped (missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
		return;
	}
	const sb = createClient(url, key, { auth: { persistSession: false } });
	const pups = [
		{
			nome: 'Luna',
			cor: 'Laranja',
			color: 'Orange',
			gender: 'female',
			price_cents: 850000,
			status: 'disponivel',
			midia: JSON.stringify([
				'/spitz-hero-desktop.webp',
				'/spitz-hero-mobile.png',
			]),
		},
		{
			nome: 'Thor',
			cor: 'Creme',
			color: 'Cream',
			gender: 'male',
			price_cents: 790000,
			status: 'disponivel',
			midia: JSON.stringify([
				'/spitz-hero-desktop.webp',
				'/1.png',
			]),
		},
		{
			nome: 'Mel',
			cor: 'Branco',
			color: 'White',
			gender: 'female',
			price_cents: 920000,
			status: 'reservado',
			midia: JSON.stringify([
				'/spitz-hero-desktop.webp',
			]),
		},
	];
	const { error } = await sb.from('puppies').insert(pups);
	if (error) {
		console.error('[seed:puppies] Error:', error.message);
	} else {
		console.log('[seed:puppies] Inserted demo puppies:', pups.length);
	}
}

async function main() {
	await seedContentLayer();
	await seedPuppies();
	await seedExperiments();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

async function seedExperiments() {
	loadEnvLocal();
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		console.log('[seed:experiments] Skipped (missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
		return;
	}
	const sb = createClient(url, key, { auth: { persistSession: false } });
	const experiment = {
		key: 'hero-cta',
		name: 'Hero CTA copy',
		description: 'Teste A/B do texto do botão principal no hero',
		status: 'running',
		audience: null,
		variants: [
			{ key: 'A', label: 'Texto original', weight: 50 },
			{ key: 'B', label: 'Texto alternativo', weight: 50 },
		],
		starts_at: new Date().toISOString(),
		ends_at: null,
	};

	// Upsert by unique key
	const { data: existing, error: findErr } = await sb.from('experiments').select('id').eq('key', experiment.key).maybeSingle();
	if (findErr) {
		console.warn('[seed:experiments] Lookup error:', findErr.message);
	}
	let res;
	if (existing?.id) {
		res = await sb.from('experiments').update(experiment).eq('id', existing.id);
	} else {
		res = await sb.from('experiments').insert(experiment);
	}
	if (res.error) {
		console.error('[seed:experiments] Error:', res.error.message);
	} else {
		console.log('[seed:experiments] Upserted demo experiment: hero-cta');
	}
}
