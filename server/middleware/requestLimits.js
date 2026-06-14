const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 100;

const requestBuckets = new Map();

function getClientKey(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function rateLimitRequests(req, res, next) {
  // Bypass rate limiting for test endpoints
  if (req.path.startsWith('/__test__')) {
    return next();
  }

  const key = getClientKey(req);
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    requestBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (bucket.count >= MAX_REQUESTS) {
    res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    return res.status(429).json({ message: "Too many requests" });
  }

  bucket.count += 1;
  return next();
}

function pruneRequestBuckets() {
  const now = Date.now();
  for (const [key, bucket] of requestBuckets.entries()) {
    if (now >= bucket.resetAt) {
      requestBuckets.delete(key);
    }
  }
}

setInterval(pruneRequestBuckets, WINDOW_MS).unref();

// Export reset function for testing
export function resetRateLimitBuckets() {
  requestBuckets.clear();
}