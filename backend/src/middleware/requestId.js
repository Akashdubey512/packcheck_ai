import crypto from "crypto";

export function requestIdMiddleware(req, res, next) {
  const id = req.headers["x-request-id"] || `req_${crypto.randomUUID().slice(0, 12)}`;
  req.requestId = id;
  res.setHeader("X-Request-ID", id);
  next();
}
