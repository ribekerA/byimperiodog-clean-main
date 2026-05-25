import { NextResponse } from 'next/server';
import { blogRepo } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    const result = await blogRepo.listSummaries({
      limit: 10,
      offset: 0,
    });

    return NextResponse.json({
      success: true,
      hasServiceKey: hasKey,
      hasUrl: Boolean(url),
      itemsCount: result.items.length,
      total: result.total,
      firstItem: result.items[0] ? {
        id: result.items[0].id,
        slug: result.items[0].slug,
        title: result.items[0].title,
      } : null,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
