// Simple in-memory rate limiter. For production, use Redis.
// Supports two modes:
// 1) Token-bucket: rateLimit(key, { capacity, refillPerSec }) -> { allowed, remaining }
// 2) Fixed-window: rateLimit(key, capacity, windowMs) -> { allowed, remaining, reset }

type TokenBucket = { tokens: number; updated: number };
const RL_BUCKETS = new Map<string, TokenBucket>();

type FixedWindow = { capacity: number; windowMs: number; windowStart: number; count: number };
const RL_WINDOWS = new Map<string, FixedWindow>();

export function rateLimit(key: string, capacity: number, windowMs: number): { allowed: boolean; remaining: number; reset: string };
export function rateLimit(key: string, opts?: { capacity?: number; refillPerSec?: number }): { allowed: boolean; remaining: number };
export function rateLimit(
  key: string,
  a?: number | { capacity?: number; refillPerSec?: number },
  b?: number,
): any {
  // Fixed-window signature: (key, capacity:number, windowMs:number)
  if (typeof a === 'number' && typeof b === 'number') {
    const capacity = a;
    const windowMs = b;
    const now = Date.now();
    const w = RL_WINDOWS.get(key) || { capacity, windowMs, windowStart: now, count: 0 };
    // reset window if needed
    if (now - w.windowStart >= w.windowMs) {
      w.windowStart = now;
      w.count = 0;
      w.capacity = capacity;
      w.windowMs = windowMs;
    }
    const allowed = w.count < capacity;
    if (allowed) w.count += 1;
    RL_WINDOWS.set(key, w);
    const remaining = Math.max(0, capacity - w.count);
    const reset = new Date(w.windowStart + w.windowMs).toISOString();
    return { allowed, remaining, reset };
  }

  // Token-bucket signature: (key, { capacity?, refillPerSec? })
  const { capacity = 20, refillPerSec = 5 } = (a as { capacity?: number; refillPerSec?: number }) || {};
  const now = Date.now();
  const bkt = RL_BUCKETS.get(key) || { tokens: capacity, updated: now };
  const deltaSec = (now - bkt.updated) / 1000;
  if (deltaSec > 0) bkt.tokens = Math.min(capacity, bkt.tokens + deltaSec * refillPerSec);
  bkt.updated = now;
  const allowed = bkt.tokens >= 1;
  if (allowed) bkt.tokens -= 1;
  RL_BUCKETS.set(key, bkt);
  return { allowed, remaining: Math.max(0, Math.floor(bkt.tokens)) };
}
