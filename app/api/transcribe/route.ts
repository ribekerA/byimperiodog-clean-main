export const dynamic = "force-dynamic";

import OpenAI from "openai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { rateLimitRequest, tooManyRequests } from "@/lib/rateLimitDurable";
import {
  RequestBodyError,
  readFormDataWithLimit,
  UpstreamTimeoutError,
  withTimeout,
} from "@/lib/requestGuards";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_AUDIO_BYTES + 1024 * 1024;

export async function POST(req: NextRequest) {
  const rate = await rateLimitRequest(req, {
    scope: "transcribe",
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (!rate.allowed) return tooManyRequests(rate);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await readFormDataWithLimit(req, MAX_MULTIPART_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Invalid multipart body" }, { status: 400 });
  }
  const audioFile = formData.get("audio") as File | null;

  if (!audioFile || audioFile.size === 0) {
    return NextResponse.json({ error: "No audio provided" }, { status: 400 });
  }
  if (audioFile.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio exceeds the 25 MB limit" }, { status: 413 });
  }
  if (audioFile.type && !audioFile.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Unsupported audio format" }, { status: 415 });
  }

  const groq = new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
    maxRetries: 1,
  });

  try {
    const transcription = await withTimeout(
      (signal) => groq.audio.transcriptions.create({
        file:            audioFile,
        model:           "whisper-large-v3-turbo",
        language:        "pt",
        response_format: "json",
      }, { signal }),
      60_000,
      "transcription",
    );

    return NextResponse.json({ text: transcription.text ?? "" });
  } catch (error) {
    if (error instanceof UpstreamTimeoutError) {
      return NextResponse.json({ error: "Transcription timed out" }, { status: 504 });
    }
    console.error("[transcribe] Groq error", error);
    return NextResponse.json({ error: "Transcription service unavailable" }, { status: 503 });
  }
}
