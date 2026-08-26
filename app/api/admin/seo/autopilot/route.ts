export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { applyAutopilotSeo, runAutopilotSeo } from "@/lib/ai/autopilot-seo";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const autorizacao = requireAdminApi(req);
  if (autorizacao) return autorizacao;

  const result = await runAutopilotSeo();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const autorizacao = requireAdminApi(request);
  if (autorizacao) return autorizacao;

  const body = await request.json().catch(() => ({}));
  const apply = Boolean(body?.apply);
  const result = apply ? await applyAutopilotSeo() : await runAutopilotSeo();

  if (!apply) {
    try {
      const sb = supabaseAdmin();
      await sb.from("seo_history").insert({
        action: "autopilot_suggestion",
        details: result,
        created_at: new Date().toISOString(),
      });
    } catch {
      // tabela pode não existir; ignoramos silenciosamente
    }
  }

  return NextResponse.json({ ok: true, result, applied: apply });
}
