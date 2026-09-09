import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { InspectionService } from "../services/inspectionService.js";
import { ReviewService } from "../services/reviewService.js";
import { ReportService } from "../services/reportService.js";

const router = express.Router();

// Configure storage with 20MB ceiling and multi-image support
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPEG, PNG, or WEBP packaging images are allowed"), false);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// Middleware supporting multiple input field names ('files', 'images', 'image', 'file')
const multiUpload = upload.fields([
  { name: "files", maxCount: 10 },
  { name: "images", maxCount: 10 },
  { name: "image", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

/**
 * POST /api/v1/inspect
 * Canonical multi-image packaging inspection endpoint.
 */
router.post("/inspect", multiUpload, async (req, res, next) => {
  try {
    const allFiles = [];
    if (req.files) {
      Object.values(req.files).forEach((arr) => allFiles.push(...arr));
    } else if (req.file) {
      allFiles.push(req.file);
    }

    if (allFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_FILES_UPLOADED", message: "Please upload at least one packaging image" },
        requestId: req.requestId,
      });
    }

    const result = await InspectionService.processInspection({
      files: allFiles,
      user: req.user,
      requestId: req.requestId,
      metadata: req.body,
    });

    res.status(201).json({
      success: true,
      data: result,
      requestId: req.requestId,
      ...result, // Flatten for backward compatibility
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/inspections
 * List paginated inspections.
 */
router.get("/inspections", async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await InspectionService.listInspections({
      status,
      page,
      limit,
      userId: req.user?.id,
    });

    res.json({
      success: true,
      data: result,
      requestId: req.requestId,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/inspections/:id
 * Retrieve detailed canonical inspection document.
 */
router.get("/inspections/:id", async (req, res, next) => {
  try {
    const result = await InspectionService.getInspectionById(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: { code: "INSPECTION_NOT_FOUND", message: `Inspection '${req.params.id}' not found` },
        requestId: req.requestId,
      });
    }

    res.json({
      success: true,
      data: result,
      requestId: req.requestId,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/inspections/:id/review
 * Officer human review override.
 */
router.post("/inspections/:id/review", async (req, res, next) => {
  try {
    const { fieldName, newValue, reason } = req.body;
    if (!fieldName || newValue === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_REVIEW_PAYLOAD", message: "fieldName and newValue are required" },
        requestId: req.requestId,
      });
    }

    const result = await ReviewService.applyReview({
      inspectionId: req.params.id,
      fieldName,
      newValue,
      reason: reason || "Manual auditor override",
      reviewer: req.user,
      requestId: req.requestId,
    });

    res.json({
      success: true,
      data: result,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/inspections/:id/report
 * Official PDF compliance certificate stream.
 */
router.get("/inspections/:id/report", async (req, res, next) => {
  try {
    const report = await ReportService.getInspectionReportPdf(req.params.id);

    res.setHeader("Content-Type", report.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
    res.send(report.buffer);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/compliance/:id
 * Retrieve statutory decision traces and compliance checks.
 */
router.get("/compliance/:id", async (req, res, next) => {
  try {
    const inspection = await InspectionService.getInspectionById(req.params.id);
    if (!inspection) {
      return res.status(404).json({
        success: false,
        error: { code: "INSPECTION_NOT_FOUND", message: "Inspection record not found" },
        requestId: req.requestId,
      });
    }

    const checks = (inspection.compliance?.ruleEvaluations || []).map((r, idx) => ({
      id: `chk_${idx + 1}`,
      ruleId: r.rule_id || `RULE_${idx + 1}`,
      ruleName: r.rule_name || "Statutory Rule",
      ruleCategory: "statutory",
      status: r.passed ? "compliant" : "violation",
      severity: r.severity?.toLowerCase() || "high",
      message: r.message || (r.passed ? "Declaration compliant" : "Mandatory declaration missing or non-compliant"),
      legalReference: r.legal_reference || "Legal Metrology (Packaged Commodities) Rules, 2011",
      confidenceScore: 0.95,
      fieldReference: r.field_name,
    }));

    const result = {
      scanId: inspection.inspectionId,
      overallStatus: inspection.complianceVerdict || "info",
      checks,
      violations: inspection.violations || [],
      decisionTrace: {
        id: `trace_${inspection.inspectionId}`,
        scanId: inspection.inspectionId,
        timestamp: inspection.uploadedAt,
        outputVerdict: inspection.status === "COMPLIANT" ? "PASS" : "FAIL",
      },
    };

    res.json({
      success: true,
      data: result,
      requestId: req.requestId,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/dashboard/metrics
 * High-level regulatory metrics.
 */
router.get("/dashboard/metrics", async (req, res, next) => {
  try {
    const metrics = await InspectionService.getDashboardMetrics();
    res.json({
      success: true,
      data: metrics,
      requestId: req.requestId,
      ...metrics,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
