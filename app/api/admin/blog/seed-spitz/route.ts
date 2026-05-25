export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const sb = supabaseAdmin();

    // 1) Upsert core tags
    const tags = [
      { slug: 'spitz-alemao', name: 'Spitz Alemão' },
      { slug: 'lulu-da-pomerania', name: 'Lulu da Pomerânia' },
      { slug: 'filhote', name: 'Filhote' },
      { slug: 'cuidados', name: 'Cuidados' },
      { slug: 'alimentacao', name: 'Alimentação' },
      { slug: 'higiene-e-tosa', name: 'Higiene e tosa' },
      { slug: 'adestramento', name: 'Adestramento' },
      { slug: 'saude', name: 'Saúde' },
    ];
    const { data: upTags, error: upTagsErr } = await sb
      .from('blog_tags')
      .upsert(tags, { onConflict: 'slug' })
      .select('id,slug');
    if (upTagsErr) throw upTagsErr;

    const tagMap = Object.fromEntries((upTags || []).map((t: any) => [t.slug, t.id]));

    // 2) Ensure demo posts exist (reuse seed-demo slugs)
    const demo = [
      'como-cuidar-do-seu-spitz-alemao-anao',
      'spitz-alemao-anao-personalidade-e-convivio',
    ];
    const { data: posts } = await sb
      .from('blog_posts')
      .select('id,slug')
      .in('slug', demo);

    const postIds = Object.fromEntries((posts || []).map((p: any) => [p.slug, p.id]));

    // 3) Link tags to posts
    const links: { post_id: string; tag_id: string }[] = [];
    if (postIds['como-cuidar-do-seu-spitz-alemao-anao']) {
      const pid = postIds['como-cuidar-do-seu-spitz-alemao-anao'];
      for (const slug of ['spitz-alemao','lulu-da-pomerania','filhote','cuidados','higiene-e-tosa']) {
        if (tagMap[slug]) links.push({ post_id: pid, tag_id: tagMap[slug] });
      }
    }
    if (postIds['spitz-alemao-anao-personalidade-e-convivio']) {
      const pid = postIds['spitz-alemao-anao-personalidade-e-convivio'];
      for (const slug of ['spitz-alemao','lulu-da-pomerania','filhote','adestramento']) {
        if (tagMap[slug]) links.push({ post_id: pid, tag_id: tagMap[slug] });
      }
    }

    if (links.length) {
      // dedup by (post_id, tag_id)
      const exist = await sb.from('blog_post_tags').select('post_id,tag_id').in('post_id', links.map(l => l.post_id));
      const existed = new Set((exist.data || []).map((x: any) => `${x.post_id}:${x.tag_id}`));
      const toInsert = links.filter((l) => !existed.has(`${l.post_id}:${l.tag_id}`));
      if (toInsert.length) await sb.from('blog_post_tags').insert(toInsert);
    }

    return NextResponse.json({ ok: true, tags: (upTags || []).length, linked: links.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
