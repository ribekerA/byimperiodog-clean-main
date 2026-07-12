import { NextResponse } from 'next/server';
import { getPostBySlug } from '@/lib/content';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug') ?? 'preco-spitz-alemao-anao';
  try {
    const post = await getPostBySlug(slug);
    if (!post) return NextResponse.json({ found: false, slug });
    return NextResponse.json({
      found: true,
      slug: post.slug,
      title: post.title,
      bodyRawLength: post.bodyRaw?.length ?? 0,
      hasBodyRaw: !!post.bodyRaw,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e), stack: (e as Error)?.stack?.split('\n').slice(0,5) }, { status: 500 });
  }
}
