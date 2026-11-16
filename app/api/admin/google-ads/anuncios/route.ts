export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { logAdminAction } from "@/lib/adminAuth";
import {
  alterarStatusDoAnuncio,
  criarAnuncioRsa,
  listarAnuncios,
  validarTextosRsa,
  type StatusAnuncio,
} from "@/lib/google-ads/ads";
import { requireAdminAds, responderErroAds } from "@/lib/google-ads/rota";
import { contaObrigatoria } from "@/lib/google-ads/selecao";
import { corpoJson } from "@/lib/limitePublico";

export async function GET(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    const anuncios = await listarAnuncios({
      userId: ctx.userId,
      customerId,
      grupoId: req.nextUrl.searchParams.get("grupoId"),
    });
    return NextResponse.json({ ok: true, anuncios });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/anuncios", error);
  }
}

const criarSchema = z
  .object({
    grupoResourceName: z.string().trim().min(1).max(300),
    titulos: z.array(z.string().trim().max(200)).min(1).max(20),
    descricoes: z.array(z.string().trim().max(400)).min(1).max(10),
    urlFinal: z.string().trim().min(1).max(2048),
    caminho1: z.string().trim().max(60).nullish(),
    caminho2: z.string().trim().max(60).nullish(),
    /** false coloca o anuncio no ar na hora; o padrao e nascer pausado. */
    pausado: z.boolean().optional(),
    somenteValidar: z.boolean().optional(),
  })
  .strict();

/**
 * Cria um anuncio responsivo de pesquisa num grupo que ja existe.
 *
 * Os limites de caractere sao conferidos antes de sair daqui: o Google recusa o
 * anuncio inteiro por um titulo de 31 caracteres, e a recusa chega como erro de
 * campo generico.
 */
export async function POST(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  const lido = await corpoJson<unknown>(req, 32 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = criarSchema.safeParse(lido.dados);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const body = parsed.data;

  const textos = {
    titulos: body.titulos,
    descricoes: body.descricoes,
    urlFinal: body.urlFinal,
    caminho1: body.caminho1 ?? null,
    caminho2: body.caminho2 ?? null,
  };

  const problemas = validarTextosRsa(textos);
  if (problemas.length > 0) {
    return NextResponse.json({ ok: false, error: "dados_invalidos", problemas }, { status: 400 });
  }

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    const resultado = await criarAnuncioRsa({
      userId: ctx.userId,
      customerId,
      grupoResourceName: body.grupoResourceName,
      textos,
      pausado: body.pausado,
      somenteValidar: body.somenteValidar,
    });

    if (!body.somenteValidar) {
      await logAdminAction({
        route: "api/admin/google-ads/anuncios",
        method: "POST",
        action: "criar_anuncio_ads",
        payload: { customerId, grupo: body.grupoResourceName, titulos: body.titulos.length },
        actor: ctx.userId,
      });
    }

    return NextResponse.json({
      ok: true,
      validado: resultado.validado,
      aviso: resultado.validado
        ? "Conferido no Google, nada foi criado."
        : body.pausado === false
          ? "Anuncio criado e ATIVO."
          : "Anuncio criado pausado. Ative quando quiser.",
    });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/anuncios", error);
  }
}

const statusSchema = z
  .object({
    anuncioResourceName: z.string().trim().min(1).max(300),
    status: z.enum(["ENABLED", "PAUSED", "REMOVED"]),
    somenteValidar: z.boolean().optional(),
  })
  .strict();

export async function PATCH(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  const lido = await corpoJson<unknown>(req, 2 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = statusSchema.safeParse(lido.dados);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    await alterarStatusDoAnuncio({
      userId: ctx.userId,
      customerId,
      anuncioResourceName: parsed.data.anuncioResourceName,
      status: parsed.data.status as StatusAnuncio,
      somenteValidar: parsed.data.somenteValidar,
    });
    await logAdminAction({
      route: "api/admin/google-ads/anuncios",
      method: "PATCH",
      action: "status_anuncio_ads",
      payload: { customerId, anuncio: parsed.data.anuncioResourceName, status: parsed.data.status },
      actor: ctx.userId,
    });
    return NextResponse.json({ ok: true, status: parsed.data.status });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/anuncios", error);
  }
}
