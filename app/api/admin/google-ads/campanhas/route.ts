export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { logAdminAction } from "@/lib/adminAuth";
import {
  alterarOrcamento,
  alterarStatusDaCampanha,
  campanhasQueUsamOrcamento,
  listarCampanhas,
  statusValido,
} from "@/lib/google-ads/campaigns";
import { criarCampanhaCompleta } from "@/lib/google-ads/launch";
import { requireAdminAds, responderErroAds } from "@/lib/google-ads/rota";
import { contaObrigatoria } from "@/lib/google-ads/selecao";
import { TETO_LANCE_CPC, TETO_ORCAMENTO_DIARIO, travaDeAtivacao, travaDeOrcamento } from "@/lib/google-ads/travas";
import { corpoJson } from "@/lib/limitePublico";

export async function GET(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    const resultado = await listarCampanhas({
      userId: ctx.userId,
      customerId,
      periodo: req.nextUrl.searchParams.get("periodo"),
      // Campanha removida nao aparece na tela, mas o que ela gastou conta no
      // periodo. Sem isto um relatorio de ano fecha com total menor que o
      // extrato da conta, e ninguem entende a diferenca.
      incluirRemovidas: req.nextUrl.searchParams.get("incluirRemovidas") === "1",
    });
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/campanhas", error);
  }
}

const textosSchema = z.object({
  titulos: z.array(z.string().trim().max(200)).min(1).max(20),
  descricoes: z.array(z.string().trim().max(400)).min(1).max(10),
  urlFinal: z.string().trim().min(1).max(2048),
  caminho1: z.string().trim().max(60).nullish(),
  caminho2: z.string().trim().max(60).nullish(),
});

const criarSchema = z
  .object({
    nome: z.string().trim().min(1).max(255),
    orcamentoDiario: z
      .number()
      .positive()
      .max(TETO_ORCAMENTO_DIARIO, `O painel aceita no maximo R$ ${TETO_ORCAMENTO_DIARIO} por dia.`),
    estrategia: z.string().trim().max(40).nullish(),
    lanceCpc: z.number().positive().max(TETO_LANCE_CPC, `O painel aceita lance de no maximo R$ ${TETO_LANCE_CPC} por clique.`).nullish(),
    dataInicio: z.string().trim().max(10).nullish(),
    dataFim: z.string().trim().max(10).nullish(),
    locais: z.array(z.string().trim().max(20)).max(50).nullish(),
    idiomas: z.array(z.string().trim().max(20)).max(10).nullish(),
    nomeDoGrupo: z.string().trim().max(255).nullish(),
    anuncio: textosSchema,
    palavrasChave: z
      .array(
        z.object({
          texto: z.string().trim().min(1).max(80),
          correspondencia: z.string().trim().max(20).nullish(),
        }),
      )
      .max(200)
      .nullish(),
    negativas: z.array(z.string().trim().min(1).max(80)).max(200).nullish(),
    /** Confere tudo no Google e nao grava nada. */
    somenteValidar: z.boolean().optional(),
  })
  .strict();

/**
 * Cria orcamento, campanha, segmentacao, grupo, anuncio e palavras-chave de uma
 * vez. Nasce PAUSADA: ativar e um PATCH separado, feito depois de conferir.
 */
export async function POST(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  const lido = await corpoJson<unknown>(req, 64 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = criarSchema.safeParse(lido.dados);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_request",
        problemas: parsed.error.issues.map((i) => `${i.path.join(".") || "corpo"}: ${i.message}`),
      },
      { status: 400 },
    );
  }

  const { somenteValidar, ...entrada } = parsed.data;

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    const resultado = await criarCampanhaCompleta({
      userId: ctx.userId,
      customerId,
      entrada: {
        ...entrada,
        anuncio: {
          ...entrada.anuncio,
          caminho1: entrada.anuncio.caminho1 ?? null,
          caminho2: entrada.anuncio.caminho2 ?? null,
        },
        palavrasChave: (entrada.palavrasChave ?? []).map((p) => ({
          texto: p.texto,
          correspondencia: p.correspondencia ?? undefined,
        })),
      },
      somenteValidar,
    });

    if (!somenteValidar) {
      await logAdminAction({
        route: "api/admin/google-ads/campanhas",
        method: "POST",
        action: "criar_campanha_ads",
        payload: {
          customerId,
          nome: entrada.nome,
          orcamentoDiario: entrada.orcamentoDiario,
          campanha: resultado.campanhaResourceName,
        },
        actor: ctx.userId,
      });
    }

    return NextResponse.json({
      ok: true,
      validado: resultado.validado,
      campanha: resultado.campanhaResourceName,
      aviso: resultado.validado
        ? "Conferido no Google, nada foi criado."
        : "Campanha criada PAUSADA. Confira os textos e ative quando quiser.",
    });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/campanhas", error);
  }
}

const alterarSchema = z
  .object({
    campanhaResourceName: z.string().trim().min(1).max(300).optional(),
    status: z.string().trim().max(20).optional(),
    orcamentoResourceName: z.string().trim().min(1).max(300).optional(),
    orcamentoDiario: z.number().positive().max(100000).optional(),
    somenteValidar: z.boolean().optional(),
    // As duas acoes que poem dinheiro em jogo so passam com o sim explicito.
    // Ver src/lib/google-ads/travas.ts.
    confirmarAtivacao: z.boolean().optional(),
    confirmarOrcamento: z.boolean().optional(),
  })
  .strict();

/** Pausa, reativa, remove ou troca o orcamento de uma campanha. */
export async function PATCH(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  const lido = await corpoJson<unknown>(req, 4 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = alterarSchema.safeParse(lido.dados);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const customerId = await contaObrigatoria(ctx.userId);

    if (body.status && body.campanhaResourceName) {
      const status = statusValido(body.status);
      if (!status) {
        return NextResponse.json({ ok: false, error: "status_invalido" }, { status: 400 });
      }
      const trava = travaDeAtivacao({ status, confirmado: body.confirmarAtivacao });
      if (trava) return NextResponse.json(trava.corpo, { status: trava.status });
      await alterarStatusDaCampanha({
        userId: ctx.userId,
        customerId,
        campanhaResourceName: body.campanhaResourceName,
        status,
        somenteValidar: body.somenteValidar,
      });
      await logAdminAction({
        route: "api/admin/google-ads/campanhas",
        method: "PATCH",
        action: "status_campanha_ads",
        payload: { customerId, campanha: body.campanhaResourceName, status },
        actor: ctx.userId,
      });
      return NextResponse.json({ ok: true, status });
    }

    if (typeof body.orcamentoDiario === "number" && body.orcamentoResourceName) {
      // Quantas campanhas dividem este orcamento: a tela avisa antes de aplicar,
      // porque orcamento compartilhado muda o gasto de todas de uma vez.
      const afetadas = await campanhasQueUsamOrcamento({
        userId: ctx.userId,
        customerId,
        orcamentoResourceName: body.orcamentoResourceName,
      });
      const trava = travaDeOrcamento({
        valorDiario: body.orcamentoDiario,
        confirmado: body.confirmarOrcamento,
        campanhasAfetadas: afetadas,
      });
      if (trava) return NextResponse.json(trava.corpo, { status: trava.status });
      await alterarOrcamento({
        userId: ctx.userId,
        customerId,
        orcamentoResourceName: body.orcamentoResourceName,
        valorDiario: body.orcamentoDiario,
        somenteValidar: body.somenteValidar,
      });
      await logAdminAction({
        route: "api/admin/google-ads/campanhas",
        method: "PATCH",
        action: "orcamento_campanha_ads",
        payload: {
          customerId,
          orcamento: body.orcamentoResourceName,
          valorDiario: body.orcamentoDiario,
          campanhasAfetadas: afetadas.length,
        },
        actor: ctx.userId,
      });
      return NextResponse.json({ ok: true, orcamentoDiario: body.orcamentoDiario, campanhasAfetadas: afetadas });
    }

    return NextResponse.json({ ok: false, error: "nada_para_alterar" }, { status: 400 });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/campanhas", error);
  }
}
