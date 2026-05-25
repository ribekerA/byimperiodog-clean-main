export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin, logAdminAction } from '@/lib/adminAuth';

const customPixelSanitizer = (input: unknown) => {
  if (!Array.isArray(input)) return [] as Array<Record<string, unknown>>;
  return input
    .map((raw, index) => {
      if (!raw || typeof raw !== 'object') return null;
      const entry = raw as Record<string, unknown>;
      const label = String(entry.label ?? `Pixel ${index + 1}`).trim();
      const codeRaw = typeof entry.code === 'string' ? entry.code : '';
      const noscriptRaw = typeof entry.noscript === 'string' ? entry.noscript : '';
      const enabled = entry.enabled === false ? false : true;
      const slot = entry.slot === 'body' ? 'body' : 'head';

      const normalizedCode = codeRaw
        .replace(/<script[^>]*>/gi, '')
        .replace(/<\/script>/gi, '')
        .trim();

      const normalizedNoscript = noscriptRaw
        .replace(/<noscript[^>]*>/gi, '')
        .replace(/<\/noscript>/gi, '')
        .trim();

      if (!label || !normalizedCode) return null;

      const id = typeof entry.id === 'string' && entry.id.trim().length > 0
        ? entry.id.trim()
        : `custom-${index + 1}`;

      return {
        id,
        label,
        slot,
        enabled,
        code: normalizedCode.slice(0, 4000),
        noscript: normalizedNoscript ? normalizedNoscript.slice(0, 2000) : null,
      };
    })
    .filter((item): item is {
      id: string;
      label: string;
      slot: 'head' | 'body';
      enabled: boolean;
      code: string;
      noscript: string | null;
    } => Boolean(item));
};

export async function POST(req: Request) {
  try {
    const auth = requireAdmin(req);
    if (auth) return auth;

    const body = await req.json().catch(() => ({}));

    const supa = supabaseAdmin();
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };

    const map: Array<[key: string, column: string]> = [
      ['gtm', 'gtm_id'],
      ['ga4', 'ga4_id'],
      ['meta_pixel_id', 'meta_pixel_id'],
      ['tiktok_pixel_id', 'tiktok_pixel_id'],
      ['google_ads_id', 'google_ads_id'],
      ['google_ads_label', 'google_ads_label'],
      ['pinterest_tag_id', 'pinterest_tag_id'],
      ['hotjar_id', 'hotjar_id'],
      ['clarity_id', 'clarity_id'],
      ['meta_domain_verify', 'meta_domain_verify'],
    ];

    for (const [inputKey, column] of map) {
      if (Object.prototype.hasOwnProperty.call(body, inputKey)) {
        const value = String(body[inputKey] ?? '').trim();
        payload[column] = value || null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'custom_pixels')) {
      payload.custom_pixels = customPixelSanitizer(body.custom_pixels);
    }

    const { error } = await supa
      .from('site_settings')
      .update(payload)
      .eq('id', 1);

    if (error) {
      await logAdminAction({
        route: '/api/admin/settings/pixels',
        method: 'POST',
        action: 'pixels_update_error',
        payload: { msg: error.message },
      });
      throw new Error(error.message);
    }

    await logAdminAction({
      route: '/api/admin/settings/pixels',
      method: 'POST',
      action: 'pixels_update_success',
      payload,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
