import { readFile } from 'fs/promises';
import path from 'path';

import { NextResponse } from 'next/server';

export const revalidate = 60; // permite atualizar se for reconstruído em deploy posterior

export async function GET(){
  try {
    const file = path.join(process.cwd(), 'public', 'search-index.json');
    const raw = await readFile(file, 'utf8');
    return new NextResponse(raw, { headers: { 'Content-Type':'application/json', 'Cache-Control':'public, max-age=60, stale-while-revalidate=300' } });
  } catch (e) {
    return NextResponse.json({ error:'index_not_found' }, { status:404 });
  }
}
