export const dynamic = "force-dynamic";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hasServiceRoleKey, supabaseAdmin } from "@/lib/supabaseAdmin";

// Rate limiting simples baseado em IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 3; // máximo 3 inscrições por minuto por IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recentTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  
  if (recentTimestamps.length >= MAX_REQUESTS) {
    return false;
  }
  
  recentTimestamps.push(now);
  rateLimitMap.set(ip, recentTimestamps);
  
  // Limpar entradas antigas periodicamente
  if (Math.random() < 0.01) {
    for (const [key, stamps] of rateLimitMap.entries()) {
      const valid = stamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
      if (valid.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, valid);
      }
    }
  }
  
  return true;
}

const newsletterSchema = z.object({
  email: z.string().email("E-mail inválido").trim().toLowerCase(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { message: "Muitas tentativas. Aguarde um momento." },
        { status: 429 }
      );
    }

    if (!hasServiceRoleKey()) {
      return NextResponse.json(
        { message: "Configuração ausente: SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
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
  } catch {
    return NextResponse.json({ message: "Erro inesperado" }, { status: 500 });
  }
}
