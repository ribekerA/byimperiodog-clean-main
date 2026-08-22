import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/lib/supabaseAdmin", () => ({
  hasServiceRoleKey: () => true,
  supabaseAdmin: () => ({ rpc: mocks.rpc }),
}));

import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  readIdempotencyKey,
  releaseIdempotentRequest,
} from "@/lib/idempotency";

beforeEach(() => {
  mocks.rpc.mockReset();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role");
});

describe("lead idempotency", () => {
  it("accepts bounded opaque keys and rejects malformed values", () => {
    expect(readIdempotencyKey(new Request("https://example.test", {
      headers: { "Idempotency-Key": "request_12345678" },
    }))).toBe("request_12345678");
    expect(readIdempotencyKey(new Request("https://example.test", {
      headers: { "Idempotency-Key": "short" },
    }))).toBeNull();
    expect(readIdempotencyKey(new Request("https://example.test", {
      headers: { "Idempotency-Key": "invalid key with spaces" },
    }))).toBeNull();
  });

  it("replays a completed response without exposing the browser key to storage", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [{ state: "completed", response_status: 200, response_body: { ok: true, id: "lead-1" } }],
      error: null,
    });

    const result = await beginIdempotentRequest("leads", "browser-request-123");

    expect(result).toMatchObject({
      state: "completed",
      responseStatus: 200,
      responseBody: { ok: true, id: "lead-1" },
    });
    const args = mocks.rpc.mock.calls[0]?.[1] as { p_key: string };
    expect(args.p_key).toMatch(/^leads:[a-f0-9]+$/);
    expect(args.p_key).not.toContain("browser-request-123");
  });

  it("completes or releases an acquired reservation", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: [{ state: "acquired" }], error: null })
      .mockResolvedValue({ data: null, error: null });

    const result = await beginIdempotentRequest("leads", "browser-request-456");
    expect(result.state).toBe("acquired");
    if (result.state !== "acquired") throw new Error("reservation not acquired");

    await completeIdempotentRequest(result.storageKey, 200, { ok: true, id: "lead-2" });
    await releaseIdempotentRequest(result.storageKey);

    expect(mocks.rpc.mock.calls.map((call) => call[0])).toEqual([
      "begin_api_idempotent_request",
      "complete_api_idempotent_request",
      "release_api_idempotent_request",
    ]);
  });
});
