// Memory-based sliding window rate limiter middleware
const hitsStore = new Map();

// Periodic cleanup of stale entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of hitsStore.entries()) {
    if (now > data.resetTime) {
      hitsStore.delete(key);
    }
  }
}, 60000).unref?.();

/**
 * Creates a rate limiter middleware for Express.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default 60000)
 * @param {number} options.max - Maximum allowed requests per window (default 120)
 * @param {string} options.message - Error message when rate limit exceeded
 */
export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60000;
  const max = options.max || 120;
  const message = options.message || "Too many requests, please try again later.";

  return (req, res, next) => {
    // Disable or bypass rate limiting in test environments
    if (process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true") {
      return next();
    }

    const key = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const routeKey = `${req.baseUrl || ""}${req.path}_${key}`;
    const now = Date.now();

    let record = hitsStore.get(routeKey);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hitsStore.set(routeKey, record);
    } else {
      record.count += 1;
    }

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message,
        },
        requestId: req.requestId,
      });
    }

    next();
  };
}

// Preset rate limiters
export const generalLimiter = createRateLimiter({ windowMs: 60000, max: 120 });
export const inspectionLimiter = createRateLimiter({ windowMs: 60000, max: 20, message: "Inspection limit reached. Please wait a minute before starting another inspection." });
export const authLimiter = createRateLimiter({ windowMs: 60000, max: 10, message: "Too many login attempts. Please wait a minute." });
