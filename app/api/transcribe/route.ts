export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

import { erroPublico } from "@/lib/apiErro";
import { excedeTamanhoDeclarado, limiteDeTaxa } from "@/lib/limitePublico";

// Áudio máximo aceito. O ditado do chat manda trechos curtos; 8 MB já são
// vários minutos de fala comprimida.
const LIMITE_AUDIO_BYTES = 8 * 1024 * 1024;

const TIPOS_ACEITOS = ["audio/", "video/webm"];

export async function POST(req: NextRequest) {
  // Rota pública que chama a Groq: cada POST é uma transcrição paga. Sem
  // limite de taxa nem teto de tamanho, um laço com arquivos grandes
  // gastava a cota da conta do canil sem passar por autenticação nenhuma.
  const bloqueio = limiteDeTaxa(req, "transcribe", 10);
  if (bloqueio) return bloqueio;

  const grandeDemais = excedeTamanhoDeclarado(req, LIMITE_AUDIO_BYTES);
  if (grandeDemais) return grandeDemais;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const audioFile = formData.get("audio") as File | null;

  if (!audioFile || audioFile.size === 0) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  // Content-Length pode faltar ou mentir; o tamanho real do arquivo é o que
  // decide.
  if (audioFile.size > LIMITE_AUDIO_BYTES) {
    return NextResponse.json({ error: "Áudio grande demais." }, { status: 413 });
  }

  const tipo = audioFile.type || "";
  if (!TIPOS_ACEITOS.some((aceito) => tipo.startsWith(aceito))) {
    return NextResponse.json({ error: "Formato de áudio não suportado" }, { status: 415 });
  }

  const groq = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });

  try {
    const transcription = await groq.audio.transcriptions.create({
      file:            audioFile,
      model:           "whisper-large-v3-turbo",
      language:        "pt",
      response_format: "json",
    });
    return NextResponse.json({ text: transcription.text ?? "" });
  } catch (e) {
    return erroPublico("api/transcribe", e);
  }
}
