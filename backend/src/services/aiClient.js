import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const AI_URL = (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 60000;

export class AIServiceError extends Error {
  constructor(code, message, details = null, statusCode = 502) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }
}

// Circuit Breaker State
let circuitState = {
  failures: 0,
  threshold: 5,
  openUntil: 0,
  cooldownMs: 15000,
};

export function resetCircuitBreaker() {
  circuitState.failures = 0;
  circuitState.openUntil = 0;
}

function checkCircuit() {
  const now = Date.now();
  if (circuitState.openUntil > now) {
    throw new AIServiceError(
      "AI_SERVICE_CIRCUIT_OPEN",
      "AI service circuit is currently open due to consecutive failures",
      { openRemainingMs: circuitState.openUntil - now },
      503
    );
  }
  if (circuitState.openUntil > 0 && now >= circuitState.openUntil) {
    // Half-open transition
    circuitState.failures = 0;
    circuitState.openUntil = 0;
  }
}

function recordSuccess() {
  circuitState.failures = 0;
  circuitState.openUntil = 0;
}

function recordFailure() {
  circuitState.failures += 1;
  if (circuitState.failures >= circuitState.threshold) {
    circuitState.openUntil = Date.now() + circuitState.cooldownMs;
  }
}

/**
 * Execute request with retry, backoff, and circuit breaker.
 */
async function executeWithRetry(fn, maxRetries = 3, initialDelay = 300) {
  checkCircuit();

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const result = await fn();
      recordSuccess();
      return result;
    } catch (err) {
      attempt++;

      // Check if error is non-retryable
      const isPermanent =
        err.response &&
        [400, 401, 403, 404].includes(err.response.status);

      if (isPermanent || attempt > maxRetries) {
        recordFailure();
        throw err;
      }

      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(2, attempt - 1) * (0.8 + Math.random() * 0.4);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

/**
 * Call the AI Microservice POST /api/v1/inspect with multipart file paths.
 * @param {Array<{ path: string, originalname: string }>|Object} files
 * @param {string} requestId
 * @param {string} inspectionId
 * @returns {Promise<Object>} Canonical AI inspection payload
 */
export async function inspectImagesViaAI(files, requestId, inspectionId) {
  const fileList = Array.isArray(files) ? files : files ? [files] : [];
  if (fileList.length === 0) {
    throw new AIServiceError("INVALID_PAYLOAD", "No files provided for AI inspection", null, 400);
  }

  return executeWithRetry(async () => {
    const formData = new FormData();
    for (const f of fileList) {
      if (f && f.path && fs.existsSync(f.path)) {
        formData.append("files", fs.createReadStream(f.path), {
          filename: f.originalname || f.filename || "image.jpg",
        });
      }
    }

    try {
      const headers = {
        ...formData.getHeaders(),
        "X-Request-ID": requestId,
      };
      if (inspectionId) {
        headers["X-Inspection-ID"] = inspectionId;
      }

      const response = await axios.post(`${AI_URL}/api/v1/inspect`, formData, {
        headers,
        timeout: TIMEOUT_MS,
        maxContentLength: 100 * 1024 * 1024,
        maxBodyLength: 100 * 1024 * 1024,
      });

      const data = response.data;
      if (!data || typeof data !== "object") {
        throw new AIServiceError(
          "AI_MALFORMED_RESPONSE",
          "AI service returned empty or non-object response",
          data
        );
      }

      return data;
    } catch (err) {
      if (err instanceof AIServiceError) throw err;

      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        throw new AIServiceError(
          "AI_SERVICE_TIMEOUT",
          `AI service inspection timed out after ${TIMEOUT_MS}ms`,
          err.message,
          504
        );
      }

      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail || err.response.data;
        if (status === 400) {
          throw new AIServiceError(
            "AI_SECURITY_REJECTED",
            typeof detail === "string" ? detail : "Image rejected by AI security guards",
            detail,
            400
          );
        }
        throw new AIServiceError(
          "AI_SERVICE_ERROR",
          `AI service returned status ${status}`,
          detail,
          502
        );
      }

      throw new AIServiceError(
        "AI_SERVICE_UNAVAILABLE",
        `Unable to connect to AI microservice at ${AI_URL}`,
        err.message,
        503
      );
    }
  });
}

/**
 * Submit a human review override event to the AI service.
 */
export async function submitHumanReviewViaAI(inspectionId, fieldName, newValue, reason, userRole, requestId) {
  return executeWithRetry(async () => {
    try {
      const response = await axios.post(
        `${AI_URL}/api/v1/review`,
        null,
        {
          params: {
            inspection_id: inspectionId,
            field_name: fieldName,
            new_value: newValue,
            reason: reason,
            user_role: userRole || "LEGAL_METROLOGY_OFFICER",
          },
          headers: { "X-Request-ID": requestId },
          timeout: 10000,
        }
      );
      return response.data;
    } catch (err) {
      if (err.response) {
        throw new AIServiceError(
          "AI_REVIEW_FAILED",
          err.response.data?.detail || "Review submission failed on AI service",
          err.response.data,
          err.response.status
        );
      }
      throw new AIServiceError(
        "AI_SERVICE_UNAVAILABLE",
        "Unable to submit review to AI service",
        err.message,
        503
      );
    }
  });
}

/**
 * Fetch official PDF report stream from the AI service.
 */
export async function fetchReportPdfViaAI(inspectionId, payload = null) {
  return executeWithRetry(async () => {
    try {
      const response = await axios.get(`${AI_URL}/api/v1/report/pdf/${inspectionId}`, {
        responseType: "arraybuffer",
        timeout: 15000,
      });
      return Buffer.from(response.data);
    } catch (err) {
      if (payload && err.response?.status === 404) {
        try {
          const postRes = await axios.post(`${AI_URL}/api/v1/report/pdf`, payload, {
            responseType: "arraybuffer",
            timeout: 15000,
          });
          return Buffer.from(postRes.data);
        } catch {
          // Fall through
        }
      }

      if (err.response?.status === 404) {
        throw new AIServiceError("REPORT_NOT_FOUND", "Report not found on AI service", null, 404);
      }
      throw new AIServiceError(
        "AI_SERVICE_ERROR",
        "Failed to retrieve PDF report from AI service",
        err.message,
        502
      );
    }
  });
}

/**
 * Liveness probe for AI service.
 */
export async function checkAIHealth() {
  try {
    const res = await axios.get(`${AI_URL}/health`, { timeout: 3000 });
    return res.data?.status === "HEALTHY" || res.data?.status === "ok";
  } catch {
    return false;
  }
}
