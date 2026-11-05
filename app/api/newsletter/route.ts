export const dynamic = "force-dynamic";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { corpoJson, limiteDeTaxa } from "@/lib/limitePublico";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

const newsletterSchema = z.object({
  email: z.string().email("E-mail inválido").trim().toLowerCase(),
  consent_lgpd: z.literal(true),
  consent_version: z.string().trim().min(1).max(20),
  source: z.string().trim().min(1).max(60).default("site"),
});

export async function POST(req: NextRequest) {
  try {
    const bloqueio = await limiteDeTaxa(req, "newsletter", 3);
    if (bloqueio) return bloqueio;

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { message: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const leitura = await corpoJson<unknown>(req, 8 * 1024);
    if (leitura.resposta) return leitura.resposta;
    const result = newsletterSchema.safeParse(leitura.dados);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error.errors[0]?.message || "E-mail inválido" },
        { status: 400 }
      );
    }

    const { email, consent_lgpd, consent_version, source } = result.data;
    const sb = supabaseAdmin();
    const { error } = await sb.from("newsletter_subscribers").insert({
      email,
      consent_lgpd,
      consent_version,
      consent_timestamp: new Date().toISOString(),
      source,
    } as Parameters<ReturnType<typeof sb.from>["insert"]>[0]);

    if (error) {
      // 23505 = unique_violation
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ message: "E-mail já inscrito" }, { status: 200 });
      }
      return NextResponse.json({ message: "Falha ao inscrever" }, { status: 500 });
    }

    return NextResponse.json({ message: "Inscrição confirmada!" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Erro inesperado" }, { status: 500 });
  }
}
