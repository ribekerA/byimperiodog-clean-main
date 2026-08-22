import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/adminAuth";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const logger = createLogger("diag:puppies");

/**
 * Inspecao de registros de filhote.
 *
 * Estava publica: qualquer visitante chamava `?id=<uuid>` e recebia
 * `select("*")` da linha inteira, consultada com a chave de servico, que
 * ignora RLS. Agora exige sessao de admin com permissao de leitura de
 * cadastros, e o erro do banco nao volta mais no corpo da resposta.
 */
export async function GET(req: Request) {
  const guard = await requireAdminApi(req, { permission: "cadastros:read" });
  if (guard) return guard;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "5", 10) || 5, 1), 50);

    const s = supabaseAdmin();

    if (id) {
      const { data, error } = await s.from("puppies").select("*").eq("id", id).single();
      if (error) {
        logger.warn("falha ao ler filhote", { error: error.message });
        return NextResponse.json({ ok: false, error: "consulta_falhou" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, record: data });
    }

    const { data, error } = await s
      .from("puppies")
      .select("id, nome, name, status, created_at, cover_url, media, midia")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.warn("falha ao listar filhotes", { error: error.message });
      return NextResponse.json({ ok: false, error: "consulta_falhou" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      count: data?.length ?? 0,
      ids: (data ?? []).map((r: { id: string }) => r.id),
      sample: data,
      note:
        "Use ?id=<uuid> para detalhar um registro específico; ?limit=N para ajustar a amostra (max 50). Campos: cover_url (capa), media (array de URLs normalizado), midia (legado).",
    });
  } catch (e: unknown) {
    logger.error("erro inesperado", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ ok: false, error: "erro_interno" }, { status: 500 });
  }
}
