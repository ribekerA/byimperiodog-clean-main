import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { POST as postLead } from "../../app/api/leads/route";
import { POST as postMatchmaker } from "../../app/api/matchmaker/route";
import { POST as postTranscription } from "../../app/api/transcribe/route";
import { embedTexts } from "@/lib/rag";
import {
  consumeDurableRateLimit,
  hashRateLimitIdentifier,
  tooManyRequests,
} from "@/lib/rateLimitDurable";
import {
  RequestBodyError,
  UpstreamTimeoutError,
  readJsonWithLimit,
  withTimeout,
} from "@/lib/requestGuards";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("request body limits", () => {
  it("rejects an oversized declared content length before parsing", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    request.headers.set("content-length", "1000");

    await expect(readJsonWithLimit(request, 100)).rejects.toMatchObject({
      status: 413,
      code: "payload_too_large",
    });
  });

  it("counts actual streamed bytes when content-length is absent", async () => {
    const request = new Request("https://example.test/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "x".repeat(200) }),
    });

    await expect(readJsonWithLimit(request, 32)).rejects.toBeInstanceOf(RequestBodyError);
  });

  it("returns 413 from a protected route", async () => {
    const request = new NextRequest("https://example.test/api/leads", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `oversized-${crypto.randomUUID()}`,
      },
      body: "{}",
    });
    request.headers.set("content-length", String(33 * 1024));

    const response = await postLead(request);
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({ code: "payload_too_large" });
  });
});

describe("durable rate limiting", () => {
  it("falls back to memory and blocks excess when service credentials are absent", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const key = `test:${crypto.randomUUID()}`;

    const first = await consumeDurableRateLimit({ key, limit: 1, windowMs: 60_000 });
    const second = await consumeDurableRateLimit({ key, limit: 1, windowMs: 60_000 });

    expect(first).toMatchObject({ allowed: true, source: "memory", remaining: 0 });
    expect(second).toMatchObject({ allowed: false, source: "memory", remaining: 0 });
  });

  it("persists only a deterministic hash of the client identifier", async () => {
    const raw = "203.0.113.42";
    const first = await hashRateLimitIdentifier(raw);
    const second = await hashRateLimitIdentifier(raw);

    expect(first).toBe(second);
    expect(first).not.toContain(raw);
    expect(first).toMatch(/^[a-f0-9]+$/);
  });

  it("builds a standards-friendly 429 response", async () => {
    const response = tooManyRequests({
      allowed: false,
      remaining: 0,
      limit: 3,
      resetAt: Date.now() + 30_000,
      source: "memory",
    });

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(response.headers.get("x-ratelimit-limit")).toBe("3");
  });

  it("blocks the matchmaker before another paid call can start", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const ip = `matchmaker-${crypto.randomUUID()}`;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await postMatchmaker(new NextRequest("https://example.test/api/matchmaker", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": ip },
        body: "{}",
      }));
      expect(response.status).toBe(400);
    }

    const blocked = await postMatchmaker(new NextRequest("https://example.test/api/matchmaker", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: "{}",
    }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });
});

describe("cost and privacy guards", () => {
  it("aborts an upstream operation after its deadline", async () => {
    await expect(withTimeout(
      () => new Promise<never>(() => undefined),
      5,
      "slow-test",
    )).rejects.toBeInstanceOf(UpstreamTimeoutError);
  });

  it("batches multiple embeddings into one upstream request", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { index: 0, embedding: [1, 0] },
          { index: 1, embedding: [0, 1] },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(embedTexts(["primeiro", "segundo"])).resolves.toEqual([[1, 0], [0, 1]]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toMatchObject({ input: ["primeiro", "segundo"] });
  });

  it("requires affirmative LGPD consent before storing a lead", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const response = await postLead(new NextRequest("https://example.test/api/leads", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `consent-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({ nome: "Maria", telefone: "11999999999", consent_lgpd: false }),
    }));

    expect(response.status).toBe(400);
  });

  it("rejects oversized transcription requests before invoking Groq", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "test-key");
    const request = new NextRequest("https://example.test/api/transcribe", {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data; boundary=test",
        "x-forwarded-for": `audio-${crypto.randomUUID()}`,
      },
      body: "--test--\r\n",
    });
    request.headers.set("content-length", String(27 * 1024 * 1024));
    const response = await postTranscription(request);

    expect(response.status).toBe(413);
  });
});
