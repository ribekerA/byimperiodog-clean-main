export const dynamic = "force-dynamic";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { rateLimitRequest, tooManyRequests } from "@/lib/rateLimitDurable";
import { RequestBodyError, readJsonWithLimit } from "@/lib/requestGuards";
import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

const newsletterSchema = z.object({
  email: z.string().email("E-mail inválido").trim().toLowerCase(),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const rate = await rateLimitRequest(req, { scope: "newsletter", limit: 3, windowMs: 60_000 });
    if (!rate.allowed) return tooManyRequests(rate, "Muitas tentativas. Aguarde um momento.");

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { message: "Configuração ausente: SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const body = await readJsonWithLimit(req, 4 * 1024);
    const result = newsletterSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.errors[0]?.message || "E-mail inválido" },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const sb = supabaseAdmin();
    const { error } = await sb.from("newsletter_subscribers").insert({ email });
    
    if (error) {
      // 23505 = unique_violation
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ message: "E-mail já inscrito" }, { status: 200 });
      }
      return NextResponse.json({ message: "Falha ao inscrever" }, { status: 500 });
    }

    return NextResponse.json({ message: "Inscrição confirmada!" }, { status: 200 });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ message: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ message: "Erro inesperado" }, { status: 500 });
  }
}
