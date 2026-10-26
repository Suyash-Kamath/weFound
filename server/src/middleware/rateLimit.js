// Small in-memory fixed-window rate limiter. Counts are per server process,
// which is enough for a single instance; use a shared store if you scale out.
export function createRateLimiter({ windowMs, max }) {
  const hits = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  cleanup.unref();

  // Returns true while the key is still under its limit.
  return function consume(key) {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= max;
  };
}

export function rateLimit({ windowMs, max, message = "Too many requests. Please try again later." }) {
  const consume = createRateLimiter({ windowMs, max });
  return (req, res, next) => {
    if (consume(req.ip)) return next();
    res.set("Retry-After", String(Math.ceil(windowMs / 1000)));
    return res.status(429).json({ error: message });
  };
}
