import crypto from "crypto";

export function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers["x-request-id"];

  // Sanitize incoming Request-ID to prevent header injection or malformed data
  const validPattern = /^[a-zA-Z0-9_-]{1,64}$/;
  let id;

  if (incomingId && typeof incomingId === "string" && validPattern.test(incomingId)) {
    id = incomingId;
  } else {
    id = `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }

  req.requestId = id;
  res.setHeader("X-Request-ID", id);
  next();
}
