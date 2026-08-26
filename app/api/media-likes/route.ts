export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { existeNoRegistro } from "@/domain/media-registry";
import { hashDoVisitante, temSegredoConfigurado, VISITOR_COOKIE } from "@/lib/media-likes/identity";
import { contarCurtidas } from "@/lib/media-likes/repo";

/**
 * GET /api/media-likes?ids=gallery:spitz-branco,foto:filhotes/branco/...
 *
 * Leitura em lote — uma chamada por página, nunca uma por foto. A página do
 * filhote pede os ids das suas mídias de uma vez e a /galeria pede os treze
 * vídeos de uma vez.
 *
 * Não cria cookie. Só quem curte de verdade ganha identidade; quem está
 * apenas olhando a contagem sai daqui do jeito que entrou.
 *
 * Nunca devolve `visitor_hash`. O que sai é `{ mediaId, count, liked }` — e
 * `liked` fala do próprio visitante, não de terceiros.
 */

// Teto de ids por chamada. A maior lista real do site tem 13; 60 deixa folga
// larga e ainda impede que alguém peça dez mil ids numa URL só.
const MAX_IDS = 60;

export async function GET(req: NextRequest) {
  const bruto = new URL(req.url).searchParams.get("ids") ?? "";
  const ids = bruto
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0 && existeNoRegistro(id))
    .slice(0, MAX_IDS);

  if (ids.length === 0) {
    return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const token = req.cookies.get(VISITOR_COOKIE)?.value;
  const visitorHash = token && temSegredoConfigurado() ? hashDoVisitante(token) : null;

  const items = await contarCurtidas(ids, visitorHash);
  if (!items) {
    // 503 e não `{ count: 0 }`: banco fora do ar não é "ninguém curtiu".
    // A interface esconde o coração em vez de mostrar um zero que não apurou.
    return NextResponse.json(
      { error: "indisponivel" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
