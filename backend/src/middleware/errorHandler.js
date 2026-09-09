import { AIServiceError } from "../services/aiClient.js";

export function errorHandler(err, req, res, next) {
  const requestId = req.requestId || req.headers["x-request-id"] || "unknown";

  const timestamp = new Date().toISOString();

  if (err instanceof AIServiceError) {
    return res.status(err.statusCode || 502).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      requestId,
      timestamp,
    });
  }

  // Multer errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: err.message,
      },
      requestId,
      timestamp,
    });
  }

  // Validation or other client errors
  if (err.statusCode || err.status) {
    return res.status(err.statusCode || err.status).json({
      success: false,
      error: {
        code: err.code || "REQUEST_ERROR",
        message: err.message,
      },
      requestId,
      timestamp,
    });
  }

  console.error(`[Internal Error] [Req: ${requestId}]:`, err.message);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred during processing",
    },
    requestId,
    timestamp,
  });
}
