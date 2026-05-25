import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/adminAuth";
import { expRepo } from "@/lib/db";
import type { Experiment } from "@/lib/db";

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const limit = Math.min(100, Number(searchParams.get("limit")) || 20);

  const result = await expRepo.listExperiments({ status, limit });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const payload = (await req.json()) as Partial<Experiment>;
  const saved = await expRepo.saveExperiment(payload);
  if (!saved) {
    return NextResponse.json({ error: "failed-to-save" }, { status: 500 });
  }
  return NextResponse.json({ item: saved });
}

export async function PATCH(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const payload = (await req.json()) as Partial<Experiment> & { id: string };
  if (!payload.id) {
    return NextResponse.json({ error: "missing-id" }, { status: 400 });
  }
  const saved = await expRepo.saveExperiment(payload);
  if (!saved) {
    return NextResponse.json({ error: "failed-to-update" }, { status: 500 });
  }
  return NextResponse.json({ item: saved });
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing-id" }, { status: 400 });
  }

  // Simple delete by marking status='completed' or removing
  const existing = await expRepo.getExperiment(id);
  if (!existing) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  // Mark as completed instead of hard delete
  await expRepo.saveExperiment({ id, status: "completed" });
  return NextResponse.json({ ok: true });
}
