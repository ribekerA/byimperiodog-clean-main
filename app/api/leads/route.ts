export const dynamic = "force-dynamic";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Schema de validação server-side alinhado com o funil de leads (contato + contexto + LGPD)
const leadSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().min(10),
  cidade: z.string().min(2),
  estado: z.string().length(2).toUpperCase(),
  sexo_preferido: z.enum(["macho", "femea", "tanto_faz"]).optional(),
  cor_preferida: z.string().optional(),
  prazo_aquisicao: z.enum(["imediato", "1_mes", "2_3_meses", "3_mais"]).optional(),
  mensagem: z.string().optional(),
  consent_lgpd: z.boolean(),
  consent_version: z.string().default("1.0"),
  consent_timestamp: z.string().optional(),
  // Contexto opcional de página
  page_type: z.string().optional(),
  page_slug: z.string().optional(),
  page_color: z.string().optional(),
  page_city: z.string().optional(),
  page_intent: z.string().optional(),
});

// Rate limiting simples (memória)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 60 segundos
const MAX_REQUESTS = 3;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitMap.entries()) {
      const valid = value.filter((t) => now - t < RATE_LIMIT_WINDOW);
      if (valid.length === 0) rateLimitMap.delete(key);
      else rateLimitMap.set(key, valid);
    }
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Muitas requisições. Aguarde 1 minuto e tente novamente." }, { status: 429 });
    }

    const body = await req.json();
    const validation = leadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validation.error.errors }, { status: 400 });
    }

    const data = validation.data;
    const url = new URL(req.url);

    // UTM params (query tem precedência, fallback no body)
    const utm_source = url.searchParams.get("utm_source") ?? body.utm_source ?? null;
    const utm_medium = url.searchParams.get("utm_medium") ?? body.utm_medium ?? null;
    const utm_campaign = url.searchParams.get("utm_campaign") ?? body.utm_campaign ?? null;
    const utm_content = url.searchParams.get("utm_content") ?? body.utm_content ?? null;
    const utm_term = url.searchParams.get("utm_term") ?? body.utm_term ?? null;

    const { error } = await supabaseAdmin()
      .from("leads")
      .insert({
        nome: data.nome,
        telefone: data.telefone,
        cidade: data.cidade,
        estado: data.estado,
        sexo_preferido: data.sexo_preferido ?? null,
        cor_preferida: data.cor_preferida ?? null,
        prazo_aquisicao: data.prazo_aquisicao ?? null,
        mensagem: data.mensagem ?? null,
        consent_lgpd: data.consent_lgpd,
        consent_version: data.consent_version,
        consent_timestamp: data.consent_timestamp ?? new Date().toISOString(),
        // Contexto
        page: url.pathname,
        page_type: data.page_type ?? null,
        page_slug: data.page_slug ?? null,
        page_color: data.page_color ?? null,
        page_city: data.page_city ?? null,
        page_intent: data.page_intent ?? null,
        referer: req.headers.get("referer"),
        gclid: url.searchParams.get("gclid"),
        fbclid: url.searchParams.get("fbclid"),
        ip_address: ip,
        user_agent: req.headers.get("user-agent"),
        // UTMs
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        source: utm_source || "site_org",
        status: "novo",
      });

    if (error) {
      console.error("[API /leads] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("[API /leads] Unexpected error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
