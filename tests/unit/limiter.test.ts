import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/limiter";

describe("rateLimit", () => {
  it("permite primeira requisicao e bloqueia excesso", () => {
    const key = `limiter-${Math.random()}`;
    expect(() => enforceRateLimit({ key, limit: 1, windowMs: 5_000 })).not.toThrow();
    expect(() => enforceRateLimit({ key, limit: 1, windowMs: 5_000 })).toThrow(AppError);
  });
});
