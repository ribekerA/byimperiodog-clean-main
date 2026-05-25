import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { blogRepo } from "@/lib/db";

export async function GET(
  req: Request,
  context: { params: { id: string } },
) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const postId = context.params.id;
  if (!postId) {
    return NextResponse.json({ error: "missing_post_id" }, { status: 400 });
  }

  try {
    const url = new URL(req.url);
    const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get("limit") || "20", 10)));
    const versions = await blogRepo.listRevisions(postId, limit);
    return NextResponse.json({
      versions: versions.map((revision) => ({
        id: revision.id,
        createdAt: revision.createdAt,
        reason: revision.reason,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message || "internal_error" }, { status: 500 });
  }
}
