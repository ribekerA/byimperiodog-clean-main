export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const audioFile = formData.get("audio") as File | null;

  if (!audioFile || audioFile.size === 0) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }

  const groq = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });

  const transcription = await groq.audio.transcriptions.create({
    file:            audioFile,
    model:           "whisper-large-v3-turbo",
    language:        "pt",
    response_format: "json",
  });

  return NextResponse.json({ text: transcription.text ?? "" });
}
