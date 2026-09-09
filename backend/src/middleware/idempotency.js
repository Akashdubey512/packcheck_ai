// In-memory idempotency cache for heavy POST operations
const cache = new Map();

// Periodic cleanup of expired cache items (10 minutes TTL)
const TTL_MS = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expiresAt) {
      cache.delete(key);
    }
  }
}, 60000).unref?.();

/**
 * Idempotency middleware for express.
 * Prevents double-submission of inspection images and duplicate backend processing.
 */
export function idempotencyMiddleware(req, res, next) {
  // Only apply to state-modifying requests (POST, PUT, PATCH)
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return next();
  }

  const key = req.headers["idempotency-key"] || req.headers["x-idempotency-key"];
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return next();
  }

  const cacheKey = `${req.method}_${req.baseUrl}${req.path}_${key.trim()}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    if (cached.status === "in_flight") {
      return res.status(409).json({
        success: false,
        error: {
          code: "REQUEST_IN_FLIGHT",
          message: "A request with this Idempotency-Key is currently being processed. Please wait.",
        },
        requestId: req.requestId,
      });
    }

    res.setHeader("X-Cache", "HIT");
    res.setHeader("X-Idempotency-Key", key);
    return res.status(cached.statusCode).json(cached.body);
  }

  // Mark as in-flight
  cache.set(cacheKey, {
    status: "in_flight",
    expiresAt: Date.now() + TTL_MS,
  });

  // Intercept res.json to capture response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    cache.set(cacheKey, {
      status: "completed",
      statusCode: res.statusCode,
      body: body,
      expiresAt: Date.now() + TTL_MS,
    });
    return originalJson(body);
  };

  next();
}

/**
 * Utility to clear idempotency cache for unit tests.
 */
export function clearIdempotencyCache() {
  cache.clear();
}
