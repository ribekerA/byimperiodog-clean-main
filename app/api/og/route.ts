import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
  const title = url.searchParams.get('title') || 'By Imperio Dog';
    const subtitle = url.searchParams.get('subtitle') || '';

    const safeTitle = String(title).slice(0, 120);
    const safeSubtitle = String(subtitle).slice(0, 120);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#06b6d4" />
            <stop offset="1" stop-color="#7c3aed" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
        <g>
          <text x="60" y="120" font-size="36" fill="#fff" font-family="Inter, system-ui, Arial" font-weight="700">By Imperio Dog</text>
          <text x="60" y="220" font-size="48" fill="#fff" font-family="Inter, system-ui, Arial" font-weight="800">${escapeHtml(safeTitle)}</text>
          ${safeSubtitle ? `<text x="60" y="300" font-size="28" fill="#fff" font-family="Inter, system-ui, Arial">${escapeHtml(safeSubtitle)}</text>` : ''}
        </g>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
 
