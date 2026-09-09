import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { InspectionRepository } from "../src/models/Inspection.js";
import { formatInspectionForFrontend, InspectionService } from "../src/services/inspectionService.js";
import { ReviewService } from "../src/services/reviewService.js";
import { requestIdMiddleware } from "../src/middleware/requestId.js";
import { errorHandler } from "../src/middleware/errorHandler.js";

test("Inspection Model & Repository Lifecycle", async (t) => {
  await t.test("creates, stores, and retrieves canonical inspection record", async () => {
    const testId = `TEST_INSP_${Date.now()}`;
    const doc = await InspectionRepository.create({
      inspectionId: testId,
      status: "PROCESSING",
      requestId: "req_test_123",
      images: [
        {
          imageId: "img_1",
          url: "/uploads/test.jpg",
          filename: "test.jpg",
          originalName: "test.jpg",
          mimeType: "image/jpeg",
          size: 1024,
          viewType: "FRONT",
        },
      ],
      fields: {
        mrp: {
          fieldName: "mrp",
          label: "MRP",
          rawValue: "Rs. 250",
          normalizedValue: "250.00",
          confidence: 0.96,
          status: "valid",
        },
      },
      provenance: {
        sha256Hashes: ["abc123hash"],
        modelVersion: "1.2.3",
      },
    });

    assert.ok(doc, "Created document should exist");
    assert.equal(doc.inspectionId, testId);
    assert.equal(doc.status, "PROCESSING");

    const retrieved = await InspectionRepository.findOne({ inspectionId: testId });
    assert.ok(retrieved, "Retrieved document should exist");
    assert.equal(retrieved.inspectionId, testId);
    assert.equal(retrieved.fields.mrp.normalizedValue, "250.00");
  });

  await t.test("updates inspection record cleanly without data loss", async () => {
    const testId = `TEST_INSP_UPDATE_${Date.now()}`;
    await InspectionRepository.create({
      inspectionId: testId,
      status: "PROCESSING",
      fields: {},
    });

    const updated = await InspectionRepository.findByIdAndUpdate(
      testId,
      {
        status: "COMPLIANT",
        compliance: {
          overallStatus: "COMPLIANT",
          violations: [],
        },
      },
      { new: true }
    );

    assert.equal(updated.status, "COMPLIANT");
    assert.equal(updated.compliance.overallStatus, "COMPLIANT");
  });
});

test("Inspection Frontend Formatter", async (t) => {
  await t.test("formats canonical model into frontend Scan schema", () => {
    const raw = {
      inspectionId: "INSP_FORMAT_TEST",
      status: "COMPLIANT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      images: [
        {
          filename: "front.jpg",
          originalName: "front_display.jpg",
          size: 2048,
          mimeType: "image/jpeg",
        },
      ],
      fields: {
        mrp: {
          fieldName: "mrp",
          label: "MRP",
          rawValue: "Rs. 99",
          normalizedValue: "99.00",
          confidence: 0.98,
          status: "valid",
        },
        genericName: {
          fieldName: "genericName",
          label: "Generic Name",
          rawValue: "Basmati Rice",
          normalizedValue: "Basmati Rice",
          confidence: 0.95,
          status: "valid",
        },
      },
      compliance: {
        overallStatus: "COMPLIANT",
        violations: [],
      },
      provenance: {
        overallConfidence: 0.92,
      },
    };

    const formatted = formatInspectionForFrontend(raw);

    assert.equal(formatted.id, "INSP_FORMAT_TEST");
    assert.equal(formatted.scanId, "INSP_FORMAT_TEST");
    assert.equal(formatted.complianceVerdict, "compliant");
    assert.equal(formatted.fileName, "front_display.jpg");
    assert.equal(formatted.product.name, "Basmati Rice");
    assert.ok(Array.isArray(formatted.extractedFields));
    assert.equal(formatted.extractedFields.length, 2);
    assert.equal(formatted.overallScore, 92);
  });
});

test("Review Service: Non-Destructive Override Workflow", async (t) => {
  await t.test("preserves aiResult while creating review audit trail and finalResult", async () => {
    const testId = `TEST_INSP_REVIEW_${Date.now()}`;
    const initialAiResult = {
      overall_status: "NON_COMPLIANT",
      unified_facts: {
        mrp: { consensus_value: "100", confidence: 0.9 },
      },
    };

    await InspectionRepository.create({
      inspectionId: testId,
      status: "NON_COMPLIANT",
      aiResult: initialAiResult,
      fields: {
        mrp: {
          fieldName: "mrp",
          rawValue: "100",
          normalizedValue: "100",
          confidence: 0.9,
          status: "valid",
        },
        netQuantity: {
          fieldName: "netQuantity",
          rawValue: "",
          normalizedValue: "",
          confidence: 0.0,
          status: "missing",
        },
        manufactureDate: {
          fieldName: "manufactureDate",
          rawValue: "01/2026",
          normalizedValue: "01/2026",
          confidence: 0.9,
          status: "valid",
        },
        manufacturer: {
          fieldName: "manufacturer",
          rawValue: "Acme Foods Pvt Ltd",
          normalizedValue: "Acme Foods Pvt Ltd",
          confidence: 0.9,
          status: "valid",
        },
        consumerCare: {
          fieldName: "consumerCare",
          rawValue: "care@acme.com",
          normalizedValue: "care@acme.com",
          confidence: 0.9,
          status: "valid",
        },
        genericName: {
          fieldName: "genericName",
          rawValue: "Snack Mix",
          normalizedValue: "Snack Mix",
          confidence: 0.9,
          status: "valid",
        },
      },
      compliance: {
        overallStatus: "NON_COMPLIANT",
        violations: ["net_quantity declaration missing"],
      },
      humanReview: [],
    });

    const reviewResult = await ReviewService.applyReview({
      inspectionId: testId,
      fieldName: "netQuantity",
      newValue: "500 g",
      reason: "Net quantity visible in back view bottom corner",
      reviewer: { id: "officer_01", role: "SENIOR_LEGAL_METROLOGY_INSPECTOR" },
      requestId: "req_review_99",
    });

    assert.ok(reviewResult.event, "Review event should be generated");
    assert.equal(reviewResult.event.fieldName, "netQuantity");
    assert.equal(reviewResult.event.newValue, "500 g");
    assert.equal(reviewResult.event.reviewerRole, "SENIOR_LEGAL_METROLOGY_INSPECTOR");

    const updatedDoc = await InspectionRepository.findOne({ inspectionId: testId });
    // AI result remains unmutated
    assert.deepEqual(updatedDoc.aiResult, initialAiResult, "Original AI result must remain untouched");
    // Final result updated
    assert.ok(updatedDoc.finalResult, "Final result must be populated");
    assert.equal(updatedDoc.finalResult.fields.netQuantity.normalizedValue, "500 g");
    // All mandatory fields are now present -> status updated to COMPLIANT
    assert.equal(updatedDoc.status, "COMPLIANT");
    assert.equal(updatedDoc.humanReview.length, 1);
  });
});

test("Dashboard Metrics Aggregation", async (t) => {
  await t.test("computes correct summary metrics", async () => {
    const metrics = await InspectionService.getDashboardMetrics();
    assert.ok(typeof metrics.totalScans === "number");
    assert.ok(typeof metrics.compliantCount === "number");
    assert.ok(typeof metrics.violationCount === "number");
    assert.ok(typeof metrics.reviewCount === "number");
    assert.ok(typeof metrics.passRate === "number");
    assert.ok(Array.isArray(metrics.recentScans));
  });
});

test("Middleware: Request ID & Error Handling", async (t) => {
  await t.test("requestIdMiddleware propagates or generates request ID", () => {
    let capturedId = null;
    let headerSent = null;

    const req = {
      headers: { "x-request-id": "custom-uuid-1234" },
    };
    const res = {
      setHeader: (name, val) => {
        if (name === "X-Request-ID") headerSent = val;
      },
    };
    const next = () => {};

    requestIdMiddleware(req, res, next);

    assert.equal(req.requestId, "custom-uuid-1234");
    assert.equal(headerSent, "custom-uuid-1234");
  });

  await t.test("errorHandler formats structured response with requestId", () => {
    const err = new Error("Validation failed");
    err.status = 422;
    err.code = "VALIDATION_ERROR";

    const req = { requestId: "trace_req_777" };
    let statusSet = null;
    let jsonOutput = null;

    const res = {
      status: (code) => {
        statusSet = code;
        return res;
      },
      json: (body) => {
        jsonOutput = body;
        return res;
      },
    };

    errorHandler(err, req, res, () => {});

    assert.equal(statusSet, 422);
    assert.equal(jsonOutput.success, false);
    assert.equal(jsonOutput.error.code, "VALIDATION_ERROR");
    assert.equal(jsonOutput.error.message, "Validation failed");
    assert.equal(jsonOutput.requestId, "trace_req_777");
    assert.ok(jsonOutput.timestamp);
  });
});
