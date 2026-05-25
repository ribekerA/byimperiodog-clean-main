import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import {
  blogRepo,
  commentRepo,
  postContentSchema,
  type BulkActionInput,
  type PostContentInput,
} from "@/lib/db";

function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

function serverError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message || "internal_error" }, { status: 500 });
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const slug = url.searchParams.get("slug");
    const metrics = url.searchParams.get("metrics") === "1";
    const pending = url.searchParams.get("pending") === "1";
    const search = url.searchParams.get("q") || "";
    const status = url.searchParams.get("status") || undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("perPage") || "50", 10)));
    const offset = (page - 1) * perPage;

    if (id) {
      const post = await blogRepo.getPostById(id);
      return NextResponse.json(post ?? {});
    }

    if (slug) {
      const post = await blogRepo.getPostBySlug(slug);
      return NextResponse.json(post ?? {});
    }

    const list = await blogRepo.listSummaries({
      search: search || undefined,
      status: status === "all" ? undefined : (status as PostContentInput["status"]),
      limit: perPage,
      offset,
      includeMetrics: metrics,
      includePendingComments: pending,
    });

    return NextResponse.json({
      items: list.items,
      total: list.total,
      page,
      perPage,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const payload = (await req.json()) as Partial<PostContentInput> & { duplicateFrom?: string };

    if (payload.duplicateFrom) {
      const duplicated = await blogRepo.duplicatePost(payload.duplicateFrom);
      if (!duplicated) return serverError("Não foi possível duplicar o post.");
      await revalidatePath("/blog");
      return NextResponse.json(duplicated);
    }

    const parsed = postContentSchema.safeParse(payload);
    if (!parsed.success) {
      return badRequest("payload_invalid", parsed.error.flatten());
    }
    const data = parsed.data;

    const existing = data.id ? await blogRepo.getPostById(data.id) : null;

    if (!data.id) {
      const slugConflict = await blogRepo.getPostBySlug(data.slug);
      if (slugConflict) {
        return NextResponse.json({ error: "slug_exists" }, { status: 409 });
      }
    } else if (existing && existing.slug !== data.slug) {
      const conflict = await blogRepo.getPostBySlug(data.slug);
      if (conflict && conflict.id !== data.id) {
        return NextResponse.json({ error: "slug_exists" }, { status: 409 });
      }
    }

    if (existing) {
      await blogRepo.recordRevision(existing.id, existing as unknown as Record<string, unknown>, "manual-update");
    }

    const saved = await blogRepo.upsertPost({
      id: data.id,
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle ?? null,
      excerpt: data.excerpt ?? null,
      content: data.content,
      status: data.status,
      coverUrl: data.coverUrl ?? null,
      coverAlt: data.coverAlt ?? null,
      category: data.category
        ? {
            id: data.category,
            slug: data.category,
            title: data.category,
            description: null,
            createdAt: null,
            updatedAt: null,
          }
        : null,
      tags: (data.tags ?? []).map((slug) => ({
        id: slug,
        slug,
        name: slug,
        createdAt: null,
      })),
      seo: {
        title: data.seoTitle ?? null,
        description: data.seoDescription ?? null,
        ogImageUrl: data.ogImageUrl ?? null,
        score: null,
      },
      scheduledAt: data.scheduledAt ?? null,
      publishedAt: data.publishedAt ?? null,
    });

    if (!saved) {
      return serverError("Falha ao salvar o post.");
    }

    await revalidatePath("/blog");
    if (saved.slug) {
      await revalidatePath(`/blog/${saved.slug}`);
    }

    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof Error && /duplicate key|slug/i.test(error.message)) {
      return NextResponse.json({ error: "slug_exists" }, { status: 409 });
    }
    return serverError(error);
  }
}

export async function PATCH(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const payload = (await req.json()) as BulkActionInput;
    const result = await blogRepo.bulkAction(payload);
    await revalidatePath("/blog");
    return NextResponse.json(result);
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return badRequest("missing_id");
    const success = await blogRepo.bulkAction({ action: "delete", postIds: [id] });
    await revalidatePath("/blog");
    return NextResponse.json(success);
  } catch (error) {
    return serverError(error);
  }
}
