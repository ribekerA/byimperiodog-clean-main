import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { approveSuggestion, applySuggestion } from "@/lib/seoSuggestions";

export async function POST(req: Request) {
  const auth = await requireAdmin(req, { permission: "blog:write" });
  if (auth) return auth;

  const body = await req.json().catch(() => ({}));
  const { action, ids } = body as { action?: string; ids?: string[] };

  if (!action || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "missing-fields" }, { status: 400 });
  }
  if (action !== "approve" && action !== "apply") {
    return NextResponse.json({ error: "invalid-action" }, { status: 400 });
  }

  const results = await Promise.allSettled(
    ids.map((id) => (action === "approve" ? approveSuggestion(id) : applySuggestion(id))),
  );

  const processed = results.filter((r) => r.status === "fulfilled").length;
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));

  return NextResponse.json({ processed, errors, total: ids.length });
}
