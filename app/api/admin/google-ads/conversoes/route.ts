export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { logAdminAction } from "@/lib/adminAuth";
import { conflitoDeLabels, listarAcoesDeConversao } from "@/lib/google-ads/conversions";
import { requireAdminAds, responderErroAds } from "@/lib/google-ads/rota";
import { contaObrigatoria } from "@/lib/google-ads/selecao";
import { corpoJson } from "@/lib/limitePublico";
import { getPixelsSettings, upsertPixelsSettings } from "@/lib/pixels";

/** Acoes de conversao da conta, com o AW- e o label ja extraidos do snippet. */
export async function GET(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    const acoes = await listarAcoesDeConversao({ userId: ctx.userId, customerId });
    const atual = await getPixelsSettings();

    return NextResponse.json({
      ok: true,
      acoes,
      // Quem nao tem label nao serve para o disparo pelo gtag -- a tela precisa
      // saber disso para nao oferecer a acao como escolha.
      semLabel: acoes.filter((a) => !a.label).map((a) => a.id),
      gravado: {
        production: {
          googleAdsId: atual.production.googleAdsId,
          lead: atual.production.googleAdsConversionLabel,
          whatsapp: atual.production.googleAdsWhatsAppLabel,
        },
        staging: {
          googleAdsId: atual.staging.googleAdsId,
          lead: atual.staging.googleAdsConversionLabel,
          whatsapp: atual.staging.googleAdsWhatsAppLabel,
        },
      },
    });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/conversoes", error);
  }
}

const gravarSchema = z
  .object({
    ambiente: z.enum(["production", "staging"]).optional(),
    /** ID da acao de conversao de LEAD (formulario enviado). */
    acaoLead: z.string().trim().min(1).max(32),
    /** ID da acao de conversao de clique no WhatsApp. */
    acaoWhatsApp: z.string().trim().min(1).max(32),
  })
  .strict();

/**
 * Grava o AW- e os dois labels em pixels_settings, lidos da propria conta.
 *
 * E a razao de ser desta integracao. O label de conversao nao existe como texto
 * copiavel na interface do Google Ads: ele vem dentro do snippet de evento, e
 * um caractere errado na transcricao produz o pior defeito possivel -- a tag
 * carrega, nenhum erro aparece, e nenhuma conversao chega ao Google Ads. Lendo
 * pela API, nao ha o que digitar errado.
 */
export async function POST(req: NextRequest) {
  const ctx = requireAdminAds(req);
  if (ctx.resposta) return ctx.resposta;

  const lido = await corpoJson<unknown>(req, 4 * 1024);
  if (lido.resposta) return lido.resposta;
  const parsed = gravarSchema.safeParse(lido.dados);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const { acaoLead, acaoWhatsApp } = parsed.data;
  const ambiente = parsed.data.ambiente ?? "production";

  try {
    const customerId = await contaObrigatoria(ctx.userId);
    const acoes = await listarAcoesDeConversao({ userId: ctx.userId, customerId });

    const lead = acoes.find((a) => a.id === acaoLead) ?? null;
    const whatsapp = acoes.find((a) => a.id === acaoWhatsApp) ?? null;

    const problemas: string[] = [];
    if (!lead) problemas.push("A acao de conversao de lead nao foi encontrada nesta conta.");
    if (!whatsapp) problemas.push("A acao de conversao de WhatsApp nao foi encontrada nesta conta.");
    if (lead && !lead.label) {
      problemas.push(`A acao "${lead.nome}" nao tem label de conversao; o site nao conseguiria dispara-la.`);
    }
    if (whatsapp && !whatsapp.label) {
      problemas.push(`A acao "${whatsapp.nome}" nao tem label de conversao; o site nao conseguiria dispara-la.`);
    }
    const conflito = conflitoDeLabels(lead, whatsapp);
    if (conflito) problemas.push(conflito);

    if (problemas.length > 0) {
      return NextResponse.json({ ok: false, error: "dados_invalidos", problemas }, { status: 400 });
    }

    const idConversao = lead!.idConversao ?? whatsapp!.idConversao;
    if (!idConversao) {
      return NextResponse.json(
        {
          ok: false,
          error: "dados_invalidos",
          problemas: ["Nao foi possivel ler o ID de conversao (AW-) do snippet destas acoes."],
        },
        { status: 400 },
      );
    }

    const atual = await getPixelsSettings();
    // Grava so o ambiente pedido e preserva o outro: producao e staging tem
    // conversoes diferentes, e sobrescrever os dois de uma vez faria o staging
    // registrar lead em producao.
    const alvo = {
      ...atual[ambiente],
      googleAdsId: idConversao,
      googleAdsConversionLabel: lead!.label,
      googleAdsWhatsAppLabel: whatsapp!.label,
    };

    await upsertPixelsSettings({
      production: ambiente === "production" ? alvo : atual.production,
      staging: ambiente === "staging" ? alvo : atual.staging,
    });

    await logAdminAction({
      route: "api/admin/google-ads/conversoes",
      method: "POST",
      action: "gravar_conversoes_ads",
      // Os labels NAO entram no log: sao a chave que identifica a conversao na
      // conta, e o log de acoes administrativas e lido por mais gente do que a
      // configuracao de pixels.
      payload: { ambiente, customerId, googleAdsId: idConversao, acaoLead, acaoWhatsApp },
      actor: ctx.userId,
    });

    return NextResponse.json({
      ok: true,
      ambiente,
      googleAdsId: idConversao,
      lead: { id: lead!.id, nome: lead!.nome, sendTo: lead!.sendTo },
      whatsapp: { id: whatsapp!.id, nome: whatsapp!.nome, sendTo: whatsapp!.sendTo },
    });
  } catch (error) {
    return responderErroAds("api/admin/google-ads/conversoes", error);
  }
}
