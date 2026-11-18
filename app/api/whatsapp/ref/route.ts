export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { registrarErro } from "@/lib/apiErro";
import { corpoJson, limiteDeTaxa } from "@/lib/limitePublico";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { FORMATO_DO_REF } from "@/lib/whatsapp-ref";

// Guarda o código curto do WhatsApp com o clique do anúncio (ver
// src/lib/whatsapp-ref.ts e a migração 20261118120000_whatsapp_refs.sql).
// Responde 204 sempre que o pedido é válido: quem chama é um sendBeacon que
// não lê resposta, e falha de banco não pode virar erro na tela de ninguém.

const idDeClique = z.string().trim().min(1).max(512).regex(/^[A-Za-z0-9_-]+$/).nullable().optional();

const corpoSchema = z
  .object({
    ref: z.string().regex(FORMATO_DO_REF),
    gclid: idDeClique,
    wbraid: idDeClique,
    gbraid: idDeClique,
    page: z.string().trim().max(300).startsWith("/").nullable().optional(),
    puppySlug: z.string().trim().max(120).regex(/^[a-z0-9-]+$/).nullable().optional(),
  })
  .strict()
  .refine((c) => Boolean(c.gclid || c.wbraid || c.gbraid), { message: "sem clique" });

export async function POST(req: NextRequest) {
  const bloqueio = await limiteDeTaxa(req, "whatsapp-ref", 20);
  if (bloqueio) return bloqueio;

  const lido = await corpoJson<unknown>(req, 4 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = corpoSchema.safeParse(lido.dados);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const c = parsed.data;
  try {
    const { error } = await supabaseAdmin()
      .from("whatsapp_refs")
      .upsert(
        {
          ref: c.ref,
          gclid: c.gclid ?? null,
          wbraid: c.wbraid ?? null,
          gbraid: c.gbraid ?? null,
          page: c.page ?? null,
          puppy_slug: c.puppySlug ?? null,
        },
        { onConflict: "ref", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
  } catch (erro) {
    registrarErro("api/whatsapp/ref", erro);
  }
  return new NextResponse(null, { status: 204 });
}
