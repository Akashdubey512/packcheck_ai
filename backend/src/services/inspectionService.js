import crypto from "crypto";
import InspectionRepository from "../models/Inspection.js";
import { inspectImagesViaAI, AIServiceError } from "./aiClient.js";
import { AuditService } from "./auditService.js";

/**
 * Maps raw AI unified facts and OCR data into canonical inspection fields.
 */
function buildCanonicalFields(aiResult) {
  const statutoryFields = [
    "mrp",
    "netQuantity",
    "manufactureDate",
    "packingDate",
    "importDate",
    "manufacturer",
    "packer",
    "importer",
    "consumerCare",
    "countryOfOrigin",
    "genericName",
    "unitSalePrice",
    "bestBefore",
    "expiryDate",
  ];

  const fieldKeyMap = {
    mrp: ["mrp", "mrp_inclusive_of_taxes", "MRP"],
    netQuantity: ["net_quantity", "netQuantity"],
    manufactureDate: ["manufacturing_packing_date", "manufacture_or_packing_date", "mfg_date", "manufactureDate"],
    packingDate: ["packing_date", "manufacturing_packing_date", "manufacture_or_packing_date", "packingDate"],
    importDate: ["import_date", "importDate"],
    manufacturer: ["manufacturer_name_and_address", "manufacturer_name_address", "manufacturer"],
    packer: ["packer", "manufacturer_name_and_address", "manufacturer_name_address"],
    importer: ["importer"],
    consumerCare: ["consumer_care_details", "consumer_care_contact", "consumer_care", "consumerCare"],
    countryOfOrigin: ["country_of_origin", "countryOfOrigin"],
    genericName: ["common_generic_name", "generic_name", "genericName"],
    unitSalePrice: ["unit_sale_price", "unitSalePrice"],
    bestBefore: ["best_before_expiry", "expiry_or_use_by_date", "best_before", "bestBefore"],
    expiryDate: ["best_before_expiry", "expiry_or_use_by_date", "expiry_date", "expiryDate"],
  };

  const fields = {};
  const unified = aiResult?.unified_facts || {};

  for (const sField of statutoryFields) {
    const candidateKeys = fieldKeyMap[sField] || [sField];
    let fact = null;
    for (const key of candidateKeys) {
      if (unified[key]?.consensus_value) {
        fact = unified[key];
        break;
      }
      if (aiResult?.fields?.[key]?.rawValue) {
        fact = {
          consensus_value: aiResult.fields[key].rawValue,
          confidence: aiResult.fields[key].confidence,
          candidate_sources: aiResult.fields[key].evidence || [],
        };
        break;
      }
    }

    const val = fact?.consensus_value ?? null;
    const found = Boolean(val && String(val).trim());
    const conf = found ? Number(fact?.mean_confidence ?? fact?.confidence ?? 0.85) : 0.0;

    fields[sField] = {
      fieldName: sField,
      label: sField.replace(/([A-Z])/g, " $1").trim(),
      rawValue: found ? String(val) : "",
      normalizedValue: found ? String(val) : "",
      confidence: Math.round(conf * 100) / 100,
      status: found ? (conf >= 0.7 ? "valid" : "uncertain") : "missing",
      evidence: fact?.candidate_sources || [],
    };
  }

  return fields;
}

/**
 * Formats a canonical inspection document into the shape expected by frontend React components.
 */
export function formatInspectionForFrontend(inspection) {
  const doc = inspection.toObject ? inspection.toObject() : inspection;
  const primaryImage = doc.images?.[0] || {};
  const status = doc.status || "PROCESSING";

  // Map compliance verdict
  let complianceVerdict = "info";
  if (status === "COMPLIANT") complianceVerdict = "compliant";
  else if (status === "NON_COMPLIANT") complianceVerdict = "violation";
  else if (status === "REVIEW_REQUIRED") complianceVerdict = "review";

  // Map extracted fields to frontend list
  const extractedFields = Object.values(doc.fields || {}).map((f) => ({
    fieldName: f.fieldName,
    label: f.label || f.fieldName,
    rawValue: f.rawValue || "",
    normalizedValue: f.normalizedValue || "",
    confidence: f.confidence || 0,
    status: f.status || (f.rawValue ? "valid" : "missing"),
  }));

  // Build product info
  const product = {
    id: doc.inspectionId,
    name: doc.fields?.genericName?.normalizedValue || "Packaged Commodity",
    gtin: "N/A",
    manufacturer: doc.fields?.manufacturer?.normalizedValue || "Unknown Manufacturer",
    category: doc.imageMetadata?.inspectedViews?.[0] || "General Commodity",
    mfgDate: doc.fields?.manufactureDate?.normalizedValue,
    expDate: doc.fields?.expiryDate?.normalizedValue || doc.fields?.bestBefore?.normalizedValue,
    netWeight: doc.fields?.netQuantity?.normalizedValue,
  };

  return {
    id: doc.inspectionId,
    scanId: doc.inspectionId,
    inspectionId: doc.inspectionId,
    fileName: primaryImage.originalName || primaryImage.filename || "package.jpg",
    fileSize: primaryImage.size || 0,
    mimeType: primaryImage.mimeType || "image/jpeg",
    fileUrl: primaryImage.url || `/uploads/${primaryImage.filename}`,
    images: doc.images || [],
    status: status === "PROCESSING" ? "PROCESSING" : "COMPLETED",
    uploadedAt: doc.createdAt,
    processedAt: doc.updatedAt,
    product,
    ocrRegions: doc.ocr?.regions || [],
    extractedFields,
    fields: doc.fields || {},
    complianceVerdict,
    overallScore: doc.compliance?.score ?? Math.round((doc.provenance?.overallConfidence || 0.85) * 100),
    compliance: {
      overallStatus: complianceVerdict,
      score: doc.compliance?.score ?? 0,
      ruleEvaluations: doc.compliance?.ruleEvaluations || [],
      checks: (doc.compliance?.ruleEvaluations || []).map((r, idx) => ({
        id: `chk_${idx}`,
        ruleId: r.rule_id || `rule_${idx}`,
        ruleName: r.rule_name || "Statutory Declaration",
        ruleCategory: "statutory",
        fieldReference: r.field_name,
        passed: Boolean(r.passed),
        status: r.passed ? "compliant" : "violation",
        severity: (r.severity || "high").toLowerCase(),
        message: r.message || (r.passed ? "Declaration compliant" : "Declaration missing or non-compliant"),
        legalReference: r.legal_reference || "Legal Metrology (Packaged Commodities) Rules, 2011",
        confidenceScore: 0.95,
        decisionTraceId: `trc_${r.rule_id || idx}`,
      })),
      violations: (doc.compliance?.violations || []).map((v, idx) => ({
        id: `viol_${idx}`,
        ruleId: v.rule_id || `rule_${idx}`,
        title: v.rule_name || "Statutory Violation",
        description: v.message || "Mandatory statutory declaration non-compliant",
        severity: (v.severity || "high").toLowerCase(),
        legalClause: "Legal Metrology (Packaged Commodities) Rules, 2011",
        recommendedAction: "Rectify the packaging to include the mandatory statutory declaration.",
      })),
    },
    contradictions: doc.contradictions || [],
    violations: doc.compliance?.violations || [],
    humanReview: doc.humanReview || [],
    requestId: doc.requestId,
    provenance: doc.provenance,
  };
}

export class InspectionService {
  /**
   * Process and persist a multi-image packaging inspection.
   */
  static async processInspection({ files, user, requestId, metadata = {} }) {
    const correlationId = requestId || `req_${crypto.randomUUID().slice(0, 12)}`;
    const inspectionId = `INSP_${Date.now().toString(36).toUpperCase()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // Build image records
    const images = files.map((f, idx) => ({
      imageId: `img_${idx + 1}`,
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
      viewType: "UNKNOWN",
      qualityStatus: "UNKNOWN",
    }));

    // Create initial document in PROCESSING state to guarantee zero data loss
    const initialDoc = await InspectionRepository.create({
      inspectionId,
      status: "PROCESSING",
      requestId: correlationId,
      uploadedBy: user?.id || user?._id || null,
      images,
      imageMetadata: { viewsAnalyzed: files.length, inspectedViews: [], coverageStatus: "UNKNOWN" },
    });

    await AuditService.recordEvent({
      requestId: correlationId,
      inspectionId,
      actorId: user?.id || "system",
      actorRole: user?.role || "OFFICER",
      action: "INSPECTION_CREATED",
      details: { imageCount: files.length },
    });

    try {
      // Execute AI computer vision pipeline
      const aiResult = await inspectImagesViaAI(files, correlationId, inspectionId);

      // Extract canonical structures
      const fields = buildCanonicalFields(aiResult);
      const rawStatus = (aiResult.overall_status || aiResult.status || "REVIEW_REQUIRED").toString().toUpperCase();

      const rawFieldResults =
        aiResult.compliance_result?.field_results ||
        aiResult.compliance_result?.rule_evaluations ||
        [];
      const rawViolations = aiResult.compliance_result?.violations || [];

      // Check if any fields failed or violations were detected
      const hasFailedFields = rawFieldResults.some(
        (r) => (r.status || "").toUpperCase() !== "PASS" && (r.status || "").toUpperCase() !== "COMPLIANT"
      );
      const hasViolations = rawViolations.length > 0;

      let finalStatus = "REVIEW_REQUIRED";
      if (hasFailedFields || hasViolations || rawStatus === "NON_COMPLIANT" || rawStatus === "FAIL") {
        finalStatus = "NON_COMPLIANT";
      } else if (rawStatus === "COMPLIANT" || rawStatus === "PASS") {
        finalStatus = "COMPLIANT";
      } else if (rawStatus === "INSUFFICIENT_EVIDENCE") {
        finalStatus = "REVIEW_REQUIRED";
      }

      // Update image records with classified view and quality
      if (Array.isArray(aiResult.coverage?.inspected_views)) {
        aiResult.coverage.inspected_views.forEach((vType, idx) => {
          if (images[idx]) images[idx].viewType = vType;
        });
      }

      // Compute provenance hash
      const hash = crypto.createHash("sha256").update(JSON.stringify(aiResult)).digest("hex");

      const ruleEvaluations = rawFieldResults.map((r) => {
        const isPassed = (r.status || "").toUpperCase() === "PASS" || (r.status || "").toUpperCase() === "COMPLIANT";
        return {
          rule_id: r.rule_id || r.ruleId,
          rule_name: r.field_name
            ? `Mandatory Declaration: ${r.field_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`
            : (r.rule_name || "Compliance Check"),
          field_name: r.field_name,
          passed: isPassed,
          severity: r.severity || "HIGH",
          message: r.explanation || r.message || (isPassed ? "Declaration compliant" : "Declaration missing or non-compliant"),
          legal_reference: r.legal_reference || "Legal Metrology (Packaged Commodities) Rules, 2011",
        };
      });

      const violations = rawViolations.map((v) => ({
        rule_id: v.rule_id,
        rule_name: v.field_name
          ? `Mandatory Declaration: ${v.field_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`
          : (v.rule_name || "Violation"),
        field_name: v.field_name,
        severity: v.severity || "HIGH",
        message: v.message || "Mandatory statutory declaration non-compliant",
        reason_code: v.reason_code,
      }));

      // Calculate score accurately
      const totalRules = ruleEvaluations.length;
      const passedCount = ruleEvaluations.filter((r) => r.passed).length;
      const score = totalRules > 0
        ? Math.max(0, Math.round((passedCount / totalRules) * 100))
        : (finalStatus === "COMPLIANT" ? 100 : 0);

      const updatePayload = {
        status: finalStatus,
        images,
        imageMetadata: {
          viewsAnalyzed: aiResult.views_analyzed || files.length,
          inspectedViews: aiResult.coverage?.inspected_views || [],
          coverageStatus: aiResult.coverage?.coverage_status || "PARTIAL_COVERAGE",
        },
        ocr: {
          fullRawText: aiResult.ocr?.full_raw_text || "",
          regions: (aiResult.ocr?.regions || []).map((r, idx) => ({
            id: r.id || `reg_${idx}`,
            boundingBox: {
              x: r.boundingBox?.x ?? r.bbox?.[0] ?? 0,
              y: r.boundingBox?.y ?? r.bbox?.[1] ?? 0,
              width: r.boundingBox?.width ?? (r.bbox ? r.bbox[2] - r.bbox[0] : 10),
              height: r.boundingBox?.height ?? (r.bbox ? r.bbox[3] - r.bbox[1] : 10),
            },
            confidence: r.confidence || 0.9,
            detectedText: r.detectedText || r.text || "",
          })),
        },
        fields,
        regulatoryDeclarations: aiResult.unified_facts || {},
        compliance: {
          overallStatus: finalStatus,
          ruleEvaluations,
          violations,
          warnings: aiResult.compliance_result?.review_items || aiResult.compliance_result?.warnings || [],
          score,
        },
        contradictions: aiResult.contradictions || [],
        aiResult,
        finalResult: {
          status: finalStatus,
          fields,
          evaluatedAt: new Date().toISOString(),
        },
        provenance: {
          sha256Hashes: [hash],
          modelVersion: aiResult.modelVersion || "1.2.3",
          ruleVersion: aiResult.ruleVersion || "PCR-2011.v2",
          executionTimeMs: aiResult.execution_time_ms || 0,
        },
      };

      const updated = await InspectionRepository.findByIdAndUpdate(
        initialDoc.inspectionId || initialDoc._id,
        updatePayload,
        { new: true }
      );

      await AuditService.recordEvent({
        requestId: correlationId,
        inspectionId,
        actorId: "ai_service",
        actorRole: "AI_MODEL",
        action: "AI_EVALUATION_COMPLETED",
        details: { status: finalStatus, sha256: hash },
        newState: { status: finalStatus },
      });

      return formatInspectionForFrontend(updated);
    } catch (err) {
      // Mark as AI_FAILED without dropping the uploaded artifact
      await InspectionRepository.findByIdAndUpdate(
        initialDoc.inspectionId || initialDoc._id,
        {
          status: "AI_FAILED",
          compliance: {
            overallStatus: "FAIL",
            violations: [{ rule_name: "AI_INSPECTION_FAILURE", message: err.message, severity: "CRITICAL" }],
            warnings: [],
          },
        },
        { new: true }
      );

      throw err;
    }
  }

  static async getInspectionById(id) {
    const doc = (await InspectionRepository.findOne({ inspectionId: id })) || (await InspectionRepository.findById(id));
    if (!doc) return null;
    return formatInspectionForFrontend(doc);
  }

  static async listInspections({ status, page = 1, limit = 20, userId }) {
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.uploadedBy = userId;

    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      InspectionRepository.find(filter, { skip, limit: Number(limit) }),
      InspectionRepository.countDocuments(filter),
    ]);

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      inspections: docs.map(formatInspectionForFrontend),
      scans: docs.map(formatInspectionForFrontend),
    };
  }

  static async getDashboardMetrics() {
    const total = await InspectionRepository.countDocuments();
    const compliant = await InspectionRepository.countDocuments({ status: "COMPLIANT" });
    const nonCompliant = await InspectionRepository.countDocuments({ status: "NON_COMPLIANT" });
    const reviewRequired = await InspectionRepository.countDocuments({ status: "REVIEW_REQUIRED" });
    const recent = await InspectionRepository.find({}, { limit: 5 });

    const passRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

    return {
      totalScans: total,
      compliantCount: compliant,
      violationCount: nonCompliant,
      reviewCount: reviewRequired,
      passRate,
      averageScore: passRate,
      recentScans: recent.map(formatInspectionForFrontend),
    };
  }
}
