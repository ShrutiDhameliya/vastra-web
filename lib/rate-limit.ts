// In-memory fixed-window rate limiter.
// Works everywhere with zero setup; on serverless it's per-instance
// (each lambda keeps its own counters) — it softens abuse, it doesn't
// hard-cap it. Swap for Upstash Ratelimit when you need the guarantee.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
    if (now - lastSweep < 60_000) return;
    lastSweep = now;
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

export function rateLimit(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    sweep(now);
    const b = buckets.get(key);
    if (!b || b.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true, retryAfter: 0 };
    }
    b.count += 1;
    return b.count > limit
        ? { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) }
        : { ok: true, retryAfter: 0 };
}

/** Vercel and most proxies put the client IP first in x-forwarded-for. */
export function clientIp(req: Request): string {
    const fwd = req.headers.get("x-forwarded-for");
    return fwd?.split(",")[0]?.trim() || "unknown";
}

export function tooMany(retryAfter: number) {
    return Response.json(
        { error: "Too many attempts — please wait a moment and try again" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
}