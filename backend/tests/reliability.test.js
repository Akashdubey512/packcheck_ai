import test from "node:test";
import assert from "node:assert/strict";

import {
  inspectImagesViaAI,
  resetCircuitBreaker,
  AIServiceError,
  checkAIHealth,
} from "../src/services/aiClient.js";
import { AuditLogRepository } from "../src/models/AuditLog.js";
import { AuditService } from "../src/services/auditService.js";
import { InspectionService } from "../src/services/inspectionService.js";
import { InspectionRepository } from "../src/models/Inspection.js";

test("Phase 2 Reliability Test Suite", async (t) => {
  await t.test("AI Client Circuit Breaker & Resiliency", async (t) => {
    await t.test("opens circuit after consecutive network failures", async () => {
      resetCircuitBreaker();

      // Trigger 5 failures by attempting to inspect with non-existent files against a closed port
      for (let i = 0; i < 5; i++) {
        try {
          await inspectImagesViaAI(
            [{ path: "./non_existent_file_path.jpg", originalname: "test.jpg" }],
            `req_fail_${i}`,
            `INSP_FAIL_${i}`
          );
        } catch (err) {
          // Expected failure
        }
      }

      // 6th call should immediately fail with AI_SERVICE_CIRCUIT_OPEN without attempting network request
      try {
        await inspectImagesViaAI(
          [{ path: "./non_existent_file_path.jpg", originalname: "test.jpg" }],
          "req_fail_6",
          "INSP_FAIL_6"
        );
        assert.fail("Should have thrown circuit open error");
      } catch (err) {
        assert.equal(err.code, "AI_SERVICE_CIRCUIT_OPEN");
        assert.equal(err.statusCode, 503);
      }

      // Reset circuit breaker for clean state
      resetCircuitBreaker();
    });
  });

  await t.test("Audit Trail Integrity & Resilient Recording", async () => {
    AuditLogRepository.clearMemory();

    const testInspId = `INSP_AUDIT_TEST_${Date.now()}`;
    await AuditService.recordEvent({
      requestId: "req_audit_1",
      inspectionId: testInspId,
      actorId: "officer_99",
      actorRole: "OFFICER",
      action: "REVIEW_OVERRIDE_APPLIED",
      details: { fieldName: "mrp", newValue: "350.00", reason: "Officer correction" },
    });

    const trail = await AuditService.getInspectionTrail(testInspId);
    assert.equal(trail.length, 1);
    assert.equal(trail[0].inspectionId, testInspId);
    assert.equal(trail[0].actorId, "officer_99");
    assert.equal(trail[0].action, "REVIEW_OVERRIDE_APPLIED");
  });

  await t.test("Pagination Guard: Limit Boundary Enforcement", async () => {
    const testId1 = `INSP_PAGIN_1_${Date.now()}`;
    const testId2 = `INSP_PAGIN_2_${Date.now()}`;

    await InspectionRepository.create({ inspectionId: testId1, status: "COMPLIANT" });
    await InspectionRepository.create({ inspectionId: testId2, status: "COMPLIANT" });

    const result = await InspectionService.listInspections({ page: 1, limit: 1 });
    assert.equal(result.limit, 1);
    assert.ok(result.inspections.length <= 1);
  });
});
