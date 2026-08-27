export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";

import { erroPublico } from "@/lib/apiErro";
import { corpoJson } from "@/lib/limitePublico";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabasePublic } from "@/lib/supabasePublic";

/**
 * Defesas do comentário público, e o que cada uma vale de verdade.
 *
 * Este é o único endpoint do site em que um desconhecido grava uma linha no
 * banco. As proteções estão em camadas porque nenhuma delas sozinha resolve:
 *
 *   1. Moderação humana — nasce `approved: false` e o GET só devolve aprovado.
 *      É a defesa real: nada que chegue aqui aparece no site sem alguém ler.
 *   2. Texto escapado — o corpo é renderizado como texto em JSX
 *      (src/components/blog/Comments.tsx), nunca com dangerouslySetInnerHTML.
 *      HTML colado num comentário aparece como HTML escrito, não executa. E o
 *      texto não é auto-linkado: um link colado aqui não vira backlink, então
 *      não há o que ganhar publicando spam de link (§135).
 *   3. Limite de corpo — `corpoJson` corta antes de desserializar.
 *   4. Isca e relógio — barram robô preguiçoso. Ver mais abaixo.
 *   5. Enxurrada por artigo — contagem no BANCO, que é durável.
 *
 * E o que NÃO vale: o `rateMap` abaixo. Ele é um Map na memória do processo.
 * Em funções serverless cada instância tem o seu, instâncias nascem e morrem a
 * cada requisição, e o site é publicado exatamente assim (Netlify). Uma rajada
 * distribuída simplesmente cai em processos diferentes e nenhum deles vê os
 * outros. Ele fica porque numa mesma instância quente ainda corta repetição
 * boba, e porque removê-lo não melhora nada — mas ele NÃO é limite global, e
 * quem for calcular risco não pode contá-lo como se fosse.
 *
 * O limite global por IP exige guardar o IP (ou um hash dele) com carimbo de
 * tempo — coluna nova em `blog_comments` ou tabela própria, ou seja, migração
 * no banco de produção. Está documentado em GITHUB_SECURITY_SETUP.md como
 * pendência; não entra numa rodada que não deve mexer no schema.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateMap = new Map<string, { count: number; resetAt: number }>();

/** Menos que isso entre abrir a página e enviar: não foi alguém digitando. */
const TEMPO_MINIMO_MS = 3_000;
/** Teto de comentários novos no MESMO artigo dentro da janela. */
const ENXURRADA_JANELA_MS = 10 * 60_000;
const ENXURRADA_MAX = 20;

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "anonymous";
}

function checkRate(req: Request) {
  const key = getClientIp(req);
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const schema = z.object({
      post_id: z.string().uuid({ message: "post_id inválido" }),
      limit: z.coerce.number().int().min(1).max(50).default(20),
      before: z
        .string()
        .trim()
        .optional()
        .refine((v) => !v || !Number.isNaN(Date.parse(v)), { message: "before inválido" }),
    });
    const parsed = schema.safeParse({
      post_id: url.searchParams.get("post_id"),
      limit: url.searchParams.get("limit") ?? undefined,
      before: url.searchParams.get("before") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Parâmetros inválidos" }, { status: 400 });
    }
    const { post_id, limit, before } = parsed.data;

    const sb = supabasePublic();
    let query = sb
      .from("blog_comments")
      .select("id,post_id,author_name,body,approved,created_at")
      .eq("post_id", post_id)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (before) query = query.lt("created_at", before);

    const { data, error } = await query;
    if (error) throw error;
    const items = data ?? [];
    let nextCursor: string | null = null;
    if (items.length > limit) {
      const last = items.pop();
      nextCursor = last?.created_at ?? null;
    }
    return NextResponse.json({ items, nextCursor });
  } catch (err: any) {
    return erroPublico("api/blog/comments", err);
  }
}

export async function POST(req: Request) {
  try {
    if (!checkRate(req)) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente em instantes." }, { status: 429 });
    }

    const schema = z.object({
      post_id: z.string().uuid({ message: "post_id inválido" }),
      author_name: z
        .string()
        .trim()
        .min(1, { message: "Nome muito curto" })
        .max(60, { message: "Nome muito longo" })
        .optional()
        .or(z.literal("").transform(() => undefined)),
      author_email: z
        .string()
        .trim()
        .email({ message: "E-mail inválido" })
        .optional()
        .or(z.literal("").transform(() => undefined)),
      body: z.string().trim().min(5, { message: "Comentário muito curto" }).max(2000, { message: "Comentário muito longo" }),
      // Campo fora da tela que só robô preenche. Ver o cabeçalho do arquivo.
      isca: z.string().max(200).optional(),
      // Quanto tempo a página ficou aberta antes do envio, medido no browser.
      aberto_ha_ms: z.coerce.number().int().nonnegative().optional(),
    });
    // O schema já limita cada campo, mas `req.json()` puro ainda
    // desserializava o corpo inteiro antes de chegar nele.
    const lido = await corpoJson<unknown>(req);
    if (lido.resposta) return lido.resposta;
    const parsed = schema.safeParse(lido.dados);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    const { post_id, author_name, author_email, body: comment, isca, aberto_ha_ms } = parsed.data;

    // Isca preenchida: descarta sem explicar o motivo. Dizer "você caiu na
    // armadilha" ensina o robô a contornar na próxima.
    if (isca && isca.trim().length > 0) {
      return NextResponse.json({ error: "Não foi possível enviar o comentário." }, { status: 400 });
    }

    // Envio instantâneo. O carimbo vem do browser e é forjável; barra o robô
    // que não se dá ao trabalho, que é a maioria.
    if (typeof aberto_ha_ms === "number" && aberto_ha_ms < TEMPO_MINIMO_MS) {
      return NextResponse.json(
        { error: "Aguarde um instante antes de enviar." },
        { status: 429 },
      );
    }

    // Ensure post exists and is published (public select on published only)
    const sbPublic = supabasePublic();
    const { data: postExist } = await sbPublic
      .from("blog_posts")
      .select("id")
      .eq("id", post_id)
      .maybeSingle();
    if (!postExist) {
      return NextResponse.json({ error: "Post inexistente ou não publicado" }, { status: 404 });
    }

    // Insert unapproved; moderation elsewhere
    const sb = supabaseAdmin();

    // Enxurrada no mesmo artigo.
    //
    // Esta é a única contagem durável do arquivo: ela pergunta ao banco, não à
    // memória do processo, então vale igual em qualquer instância serverless.
    // Não protege o site inteiro — protege o artigo que estiver sendo alvo, que
    // é o formato usual do abuso. Passar do teto devolve 429 e a fila de
    // moderação não vira lixeira.
    const desde = new Date(Date.now() - ENXURRADA_JANELA_MS).toISOString();
    const { count: recentes } = await sb
      .from("blog_comments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", post_id)
      .gte("created_at", desde);
    if (typeof recentes === "number" && recentes >= ENXURRADA_MAX) {
      return NextResponse.json(
        { error: "Este artigo recebeu muitos comentários agora há pouco. Tente mais tarde." },
        { status: 429 },
      );
    }
    const { data, error } = await sb
      .from("blog_comments")
      .insert([{ post_id, author_name, author_email, body: comment }])
      .select("id,post_id,author_name,body,approved,created_at")
      .single();
    if (error) throw error;

    return NextResponse.json({ ok: true, comment: data }, { status: 201 });
  } catch (err: any) {
    return erroPublico("api/blog/comments", err);
  }
}
