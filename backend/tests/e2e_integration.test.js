import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import http from "http";
import mongoose from "mongoose";
import { app } from "../src/server.js";

const CANDIDATE_IMAGE_PATHS = [
  path.resolve(process.cwd(), "../ai-service/archive (1)/product_desc_english/DC product_desc_english (1).jpg"),
  path.resolve(process.cwd(), "ai-service/archive (1)/product_desc_english/DC product_desc_english (1).jpg"),
  "D:\\packcheck\\packcheck_ai\\ai-service\\archive (1)\\product_desc_english\\DC product_desc_english (1).jpg",
];

const SAMPLE_IMAGE_PATH = CANDIDATE_IMAGE_PATHS.find((p) => fs.existsSync(p)) || CANDIDATE_IMAGE_PATHS[0];

test("End-to-End System Integration: Gateway <-> AI Service <-> Statutory Engine", async (t) => {
  let server;
  let baseUrl;

  // Start Gateway on an ephemeral free port
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`Test Gateway server started at ${baseUrl}`);
      resolve();
    });
  });

  t.after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  await t.test("Gateway Health Probe (/health)", async () => {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(10000) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    assert.equal(body.service, "packcheck-backend-gateway");
  });

  let createdInspectionId = null;

  async function ensureInspectionCreated() {
    if (createdInspectionId) return createdInspectionId;
    assert.ok(fs.existsSync(SAMPLE_IMAGE_PATH), `Sample packaging image must exist on disk: ${SAMPLE_IMAGE_PATH}`);
    const fileBytes = fs.readFileSync(SAMPLE_IMAGE_PATH);
    const blob = new Blob([fileBytes], { type: "image/jpeg" });
    const form = new FormData();
    form.append("files", blob, "dc_product_front.jpg");

    const res = await fetch(`${baseUrl}/api/v1/inspect`, {
      method: "POST",
      body: form,
      headers: { "X-Request-ID": "e2e-trace-inspect-001" },
      signal: AbortSignal.timeout(45000),
    });

    assert.equal(res.status, 201, `Inspection creation failed with HTTP ${res.status}`);
    const body = await res.json();
    assert.equal(body.success, true);
    createdInspectionId = body.data?.id || body.data?.inspectionId;
    return createdInspectionId;
  }

  await t.test("POST /api/v1/inspect - Multi-Image Packaging Inspection Flow", async () => {
    assert.ok(fs.existsSync(SAMPLE_IMAGE_PATH), "Sample packaging image must exist on disk");
    const fileBytes = fs.readFileSync(SAMPLE_IMAGE_PATH);
    const blob = new Blob([fileBytes], { type: "image/jpeg" });

    const form = new FormData();
    form.append("files", blob, "dc_product_front.jpg");

    const res = await fetch(`${baseUrl}/api/v1/inspect`, {
      method: "POST",
      body: form,
      headers: {
        "X-Request-ID": "e2e-trace-inspect-001",
      },
      signal: AbortSignal.timeout(45000),
    });

    assert.equal(res.status, 201, `Inspection creation failed with HTTP ${res.status}`);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data, "Response data should be defined");

    const inspection = body.data;
    createdInspectionId = inspection.id || inspection.inspectionId;
    assert.ok(createdInspectionId, "Inspection must return an ID");

    // Check status and canonical verdict
    assert.ok(
      ["COMPLIANT", "NON_COMPLIANT", "REVIEW_REQUIRED"].includes(inspection.status) ||
      ["compliant", "violation", "review"].includes(inspection.complianceVerdict),
      `Unexpected status: ${inspection.status}, verdict: ${inspection.complianceVerdict}`
    );

    // Check images provenance
    assert.ok(Array.isArray(inspection.images));
    assert.ok(inspection.images.length >= 1);
    assert.equal(inspection.images[0].originalName, "dc_product_front.jpg");

    // Check extracted fields
    assert.ok(Array.isArray(inspection.extractedFields));
    assert.ok(inspection.extractedFields.length > 0);
    assert.ok(inspection.fields, "Fields object must be present");
    assert.ok("mrp" in inspection.fields);
    assert.ok("netQuantity" in inspection.fields);
    assert.ok("manufactureDate" in inspection.fields);

    // Check provenance
    assert.ok(inspection.provenance);
    assert.ok(Array.isArray(inspection.provenance.sha256Hashes));
    assert.ok(inspection.provenance.sha256Hashes.length > 0);
    assert.equal(inspection.provenance.sha256Hashes[0].length, 64, "SHA-256 hash must be 64 hex characters");
  });

  await t.test("GET /api/v1/inspections/:id - Retrieve Inspection Details", async () => {
    await ensureInspectionCreated();
    const res = await fetch(`${baseUrl}/api/v1/inspections/${createdInspectionId}`, {
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.id, createdInspectionId);
  });

  await t.test("GET /api/v1/compliance/:id - Statutory Decision Trace", async () => {
    await ensureInspectionCreated();
    const res = await fetch(`${baseUrl}/api/v1/compliance/${createdInspectionId}`, {
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.checks, "Rule checks should be present");
    assert.ok(body.data.decisionTrace, "Decision trace should be present");
    assert.equal(body.data.decisionTrace.scanId, createdInspectionId);
  });

  await t.test("POST /api/v1/inspections/:id/review - Officer Human Review Override", async () => {
    await ensureInspectionCreated();
    const overridePayload = {
      fieldName: "mrp",
      newValue: "₹ 199.00",
      reason: "E2E automated verification override of MRP declaration",
    };

    const res = await fetch(`${baseUrl}/api/v1/inspections/${createdInspectionId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": "e2e-trace-review-002",
      },
      body: JSON.stringify(overridePayload),
      signal: AbortSignal.timeout(15000),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.event);
    assert.equal(body.data.event.fieldName, "mrp");
    assert.equal(body.data.event.newValue, "₹ 199.00");
    assert.equal(body.data.event.aiSync?.status, "SYNCED", "AI review synchronization must be active and SYNCED");

    // Fetch inspection again to ensure non-destructive audit trail
    const refetched = await (await fetch(`${baseUrl}/api/v1/inspections/${createdInspectionId}`, {
      signal: AbortSignal.timeout(10000),
    })).json();
    assert.ok(Array.isArray(refetched.data.humanReview));
    assert.ok(refetched.data.humanReview.length >= 1);
    assert.equal(refetched.data.humanReview[refetched.data.humanReview.length - 1].newValue, "₹ 199.00");
  });

  await t.test("GET /api/v1/inspections/:id/report - PDF Compliance Certificate Generation", async () => {
    await ensureInspectionCreated();
    const res = await fetch(`${baseUrl}/api/v1/inspections/${createdInspectionId}/report`, {
      signal: AbortSignal.timeout(25000),
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/pdf");

    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    assert.ok(buf.length > 500, "PDF buffer must not be empty");

    // Validate PDF magic header '%PDF'
    const pdfMagic = buf.slice(0, 4).toString("utf-8");
    assert.equal(pdfMagic, "%PDF", "Report stream must start with valid PDF magic bytes '%PDF'");
  });

  await t.test("GET /api/v1/dashboard/metrics - Updated Metrics Aggregation", async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/metrics`, {
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.totalScans >= 1);
  });
});
