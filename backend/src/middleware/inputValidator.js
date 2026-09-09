/**
 * Input sanitization and validation middleware to block NoSQL injection, prototype pollution, and malformed parameters.
 */

// Helper to detect NoSQL injection or prototype pollution objects
function containsInjectionPayload(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === "object") {
    const keys = Object.keys(val);
    for (const key of keys) {
      if (key.startsWith("$") || key.includes(".") || key === "__proto__" || key === "constructor" || key === "prototype") {
        return true;
      }
      if (containsInjectionPayload(val[key])) return true;
    }
  }
  return false;
}

/**
 * Validates route inspection ID parameter.
 */
export function validateInspectionId(req, res, next) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Inspection ID parameter is required",
      },
      requestId: req.requestId,
    });
  }

  // Inspection ID must be alphanumeric/underscores/hyphens/colons, length between 3 and 128
  const validPattern = /^[a-zA-Z0-9_\-:.]{3,128}$/;
  if (!validPattern.test(id) || containsInjectionPayload(id)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Invalid Inspection ID format or malicious payload detected",
      },
      requestId: req.requestId,
    });
  }

  next();
}

/**
 * Validates query pagination and filter parameters for listing inspections.
 */
export function validateListQueryParams(req, res, next) {
  if (containsInjectionPayload(req.query)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Malicious injection payload detected in query parameters",
      },
      requestId: req.requestId,
    });
  }

  const { page, limit, status } = req.query;

  if (page !== undefined) {
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Query parameter 'page' must be a positive integer >= 1",
        },
        requestId: req.requestId,
      });
    }
    req.query.page = parsedPage;
  }

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Query parameter 'limit' must be an integer between 1 and 100",
        },
        requestId: req.requestId,
      });
    }
    req.query.limit = parsedLimit;
  }

  if (status !== undefined && typeof status === "string") {
    const validStatuses = [
      "COMPLIANT",
      "NON_COMPLIANT",
      "MANUAL_REVIEW_REQUIRED",
      "PROCESSING",
      "FAILED",
      "ALL",
    ];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: `Query parameter 'status' must be one of: ${validStatuses.join(", ")}`,
        },
        requestId: req.requestId,
      });
    }
  }

  next();
}

/**
 * Validates body payload for human review overrides.
 */
export function validateReviewPayload(req, res, next) {
  if (containsInjectionPayload(req.body)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Malicious injection payload detected in request body",
      },
      requestId: req.requestId,
    });
  }

  const { fieldName, newValue, reason } = req.body || {};

  if (!fieldName || typeof fieldName !== "string" || fieldName.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Review payload requires non-empty string 'fieldName'",
      },
      requestId: req.requestId,
    });
  }

  if (newValue === undefined || typeof newValue !== "string") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Review payload requires string 'newValue'",
      },
      requestId: req.requestId,
    });
  }

  if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Review payload requires non-empty string 'reason' explaining the justification for override",
      },
      requestId: req.requestId,
    });
  }

  next();
}
