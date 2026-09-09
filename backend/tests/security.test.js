import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

import { requireAuth, requireRole } from "../src/middleware/auth.js";
import {
  validateInspectionId,
  validateListQueryParams,
  validateReviewPayload,
} from "../src/middleware/inputValidator.js";
import { validateUploadedFiles, sanitizeFilename } from "../src/middleware/fileSecurity.js";
import { escapeHtml, buildReportHtml } from "../src/utils/pdfGenerator.js";
import { idempotencyMiddleware, clearIdempotencyCache } from "../src/middleware/idempotency.js";
import { securityHeadersMiddleware } from "../src/middleware/securityHeaders.js";

const JWT_SECRET = process.env.JWT_SECRET || "packcheck_dev_secret_key_2026";

test("Phase 2 Security Test Suite", async (t) => {
  await t.test("Authentication Middleware: Valid, Invalid, Expired & Enforcement", async (t) => {
    await t.test("attaches officer session when valid JWT token is provided", () => {
      const token = jwt.sign({ id: "officer_101", role: "officer", email: "officer101@gov.in" }, JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: "1h",
      });

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      let nextCalled = false;

      requireAuth(req, res, () => {
        nextCalled = true;
      });

      assert.ok(nextCalled, "next() should be called for valid token");
      assert.equal(req.user.id, "officer_101");
      assert.equal(req.user.role, "officer");
    });

    await t.test("rejects tampered / invalid JWT signature with 401", () => {
      const fakeToken = jwt.sign({ id: "hacker" }, "wrong_secret_key_123");

      const req = { headers: { authorization: `Bearer ${fakeToken}` }, requestId: "req_sec_1" };
      let statusValue = 0;
      let jsonBody = null;

      const res = {
        statusCode: 200,
        status(s) {
          statusValue = s;
          this.statusCode = s;
          return this;
        },
        json(b) {
          jsonBody = b;
          return this;
        },
      };

      requireAuth(req, res, () => {});

      assert.equal(statusValue, 401);
      assert.equal(jsonBody.success, false);
      assert.equal(jsonBody.error.code, "UNAUTHORIZED");
    });

    await t.test("rejects expired JWT token with 401", () => {
      const expiredToken = jwt.sign({ id: "officer_expired" }, JWT_SECRET, { expiresIn: "-1s" });

      const req = { headers: { authorization: `Bearer ${expiredToken}` }, requestId: "req_sec_2" };
      let statusValue = 0;
      let jsonBody = null;

      const res = {
        statusCode: 200,
        status(s) {
          statusValue = s;
          this.statusCode = s;
          return this;
        },
        json(b) {
          jsonBody = b;
          return this;
        },
      };

      requireAuth(req, res, () => {});

      assert.equal(statusValue, 401);
      assert.equal(jsonBody.error.message, "Token has expired");
    });
  });

  await t.test("RBAC Middleware: Role Restrictions", async (t) => {
    await t.test("allows matching role access", () => {
      const req = { user: { role: "admin" } };
      let called = false;
      const middleware = requireRole("admin", "superadmin");
      middleware(req, {}, () => {
        called = true;
      });
      assert.ok(called);
    });

    await t.test("blocks non-permitted role with 403 Forbidden", () => {
      const req = { user: { role: "officer" }, requestId: "req_sec_rbac" };
      let statusValue = 0;
      let jsonBody = null;
      const res = {
        statusCode: 200,
        status(s) {
          statusValue = s;
          this.statusCode = s;
          return this;
        },
        json(b) {
          jsonBody = b;
          return this;
        },
      };

      const middleware = requireRole("admin");
      middleware(req, res, () => {});

      assert.equal(statusValue, 403);
      assert.equal(jsonBody.error.code, "FORBIDDEN");
    });
  });

  await t.test("Input Validation & Anti-Injection Guard", async (t) => {
    await t.test("rejects malicious NoSQL query parameters", () => {
      const req = { query: { status: { $gt: "" } }, requestId: "req_sec_nosql" };
      let statusValue = 0;
      let jsonBody = null;
      const res = {
        statusCode: 200,
        status(s) {
          statusValue = s;
          this.statusCode = s;
          return this;
        },
        json(b) {
          jsonBody = b;
          return this;
        },
      };

      validateListQueryParams(req, res, () => {});
      assert.equal(statusValue, 400);
      assert.equal(jsonBody.error.code, "INVALID_INPUT");
    });

    await t.test("rejects malformed inspection ID parameter", () => {
      const req = { params: { id: "../../../etc/passwd" }, requestId: "req_sec_id" };
      let statusValue = 0;
      let jsonBody = null;
      const res = {
        statusCode: 200,
        status(s) {
          statusValue = s;
          this.statusCode = s;
          return this;
        },
        json(b) {
          jsonBody = b;
          return this;
        },
      };

      validateInspectionId(req, res, () => {});
      assert.equal(statusValue, 400);
    });

    await t.test("validates review payload field parameters", () => {
      const req = { body: { fieldName: "", newValue: "100", reason: "" }, requestId: "req_sec_rev" };
      let statusValue = 0;
      const res = {
        statusCode: 200,
        status(s) {
          statusValue = s;
          this.statusCode = s;
          return this;
        },
        json() {
          return this;
        },
      };

      validateReviewPayload(req, res, () => {});
      assert.equal(statusValue, 400);
    });
  });

  await t.test("File Upload Security & Magic Byte Inspection", async (t) => {
    await t.test("sanitizes filename and strips path traversal characters", () => {
      const rawName = "../../uploads/malicious\0file.jpg";
      const clean = sanitizeFilename(rawName);
      assert.equal(clean, "maliciousfile.jpg");
    });

    await t.test("rejects fake image file failing magic byte inspection", () => {
      const fakeImgPath = path.resolve("./uploads/fake_test_image.jpg");
      fs.writeFileSync(fakeImgPath, "THIS IS TEXT CONTENT NOT AN IMAGE HEADER");

      const req = {
        files: [{ originalname: "fake.jpg", mimetype: "image/jpeg", path: fakeImgPath, size: 40 }],
        requestId: "req_magic_test",
      };
      let statusValue = 0;
      let jsonBody = null;
      const res = {
        statusCode: 200,
        status(s) {
          statusValue = s;
          this.statusCode = s;
          return this;
        },
        json(b) {
          jsonBody = b;
          return this;
        },
      };

      validateUploadedFiles(req, res, () => {});

      assert.equal(statusValue, 400);
      assert.equal(jsonBody.error.code, "INVALID_FILE_TYPE");
      assert.ok(!fs.existsSync(fakeImgPath), "Fake image should be cleaned up immediately");
    });
  });

  await t.test("Report PDF HTML Sanitization (XSS Defenses)", () => {
    const maliciousInput = "<script>alert('XSS')</script>";
    const escaped = escapeHtml(maliciousInput);
    assert.equal(escaped, "&lt;script&gt;alert(&#039;XSS&#039;)&lt;/script&gt;");

    const scanWithScript = {
      inspectionId: "INSP_<script>bad</script>",
      status: "COMPLIANT",
      fields: {
        mrp: { fieldName: "mrp", rawValue: "<img src=x onerror=alert(1)>", normalizedValue: "100.00" },
      },
    };

    const html = buildReportHtml(scanWithScript);
    assert.ok(!html.includes("<script>bad</script>"));
    assert.ok(html.includes("&lt;script&gt;bad&lt;/script&gt;"));
  });

  await t.test("Idempotency Middleware: Prevents Duplicate Request Processing", () => {
    clearIdempotencyCache();
    const req = {
      method: "POST",
      baseUrl: "/api/v1",
      path: "/inspect",
      headers: { "idempotency-key": "key_unique_123" },
      requestId: "req_idemp_1",
    };

    const resHeaders = {};
    let statusValue = 0;
    let responseBody = null;

    const res = {
      statusCode: 200,
      setHeader(k, v) {
        resHeaders[k] = v;
      },
      status(s) {
        statusValue = s;
        this.statusCode = s;
        return this;
      },
      json(b) {
        responseBody = b;
        return this;
      },
    };

    // First request
    idempotencyMiddleware(req, res, () => {
      res.status(201).json({ success: true, id: "INSP_FIRST" });
    });

    assert.equal(statusValue, 201);
    assert.equal(responseBody.id, "INSP_FIRST");

    // Second request with same idempotency key
    let secondStatus = 0;
    let secondBody = null;
    const res2 = {
      statusCode: 200,
      setHeader(k, v) {
        resHeaders[k] = v;
      },
      status(s) {
        secondStatus = s;
        this.statusCode = s;
        return this;
      },
      json(b) {
        secondBody = b;
        return this;
      },
    };

    idempotencyMiddleware(req, res2, () => {
      assert.fail("Should not execute handler on idempotency cache hit");
    });

    assert.equal(secondStatus, 201);
    assert.equal(secondBody.id, "INSP_FIRST");
    assert.equal(resHeaders["X-Cache"], "HIT");
  });

  await t.test("Security Headers Middleware", () => {
    const req = {};
    const resHeaders = {};
    const res = {
      setHeader(k, v) {
        resHeaders[k] = v;
      },
    };

    securityHeadersMiddleware(req, res, () => {});

    assert.equal(resHeaders["X-Content-Type-Options"], "nosniff");
    assert.equal(resHeaders["X-Frame-Options"], "DENY");
    assert.ok(resHeaders["Content-Security-Policy"]);
  });
});
