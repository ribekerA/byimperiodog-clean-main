import { AppError } from "@/lib/errors";

type RateLimitState = {
  count: number;
  expiresAt: number;
};

type RateLimitResult = {
  remaining: number;
  resetAt: number;
  limit: number;
};

const buckets = new Map<string, RateLimitState>();

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}

export function checkRateLimit({ key, limit, windowMs, now = Date.now() }: RateLimitOptions): RateLimitResult & { allowed: boolean } {
  const bucket = buckets.get(key);

  if (!bucket || bucket.expiresAt <= now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
      limit,
    };
  }

  if (bucket.count < limit) {
    bucket.count += 1;
    return {
      allowed: true,
      remaining: limit - bucket.count,
      resetAt: bucket.expiresAt,
      limit,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetAt: bucket.expiresAt,
    limit,
  };
}

export function enforceRateLimit(options: RateLimitOptions): RateLimitResult {
  const result = checkRateLimit(options);
  if (!result.allowed) {
    throw new AppError({
      code: "RATE_LIMIT",
      message: "Limite de requisições atingido. Tente novamente em instantes.",
      details: {
        resetAt: result.resetAt,
        limit: result.limit,
      },
    });
  }
  return result;
}

export function getRequestFingerprint(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}

export function rateLimit(req: Request, options: { identifier?: string; limit: number; windowMs: number }) {
  const fingerprint = getRequestFingerprint(req);
  const key = `${options.identifier ?? "global"}:${fingerprint}:${req.method}`;
  return enforceRateLimit({
    key,
    limit: options.limit,
    windowMs: options.windowMs,
  });
}

