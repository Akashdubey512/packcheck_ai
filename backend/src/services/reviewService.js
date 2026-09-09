import InspectionRepository from "../models/Inspection.js";
import { submitHumanReviewViaAI } from "./aiClient.js";
import { formatInspectionForFrontend } from "./inspectionService.js";

export class ReviewService {
  /**
   * Submit an officer human override.
   * Preserves original aiResult and computes updated finalResult.
   */
  static async applyReview({ inspectionId, fieldName, newValue, reason, reviewer, requestId }) {
    const inspection =
      (await InspectionRepository.findOne({ inspectionId })) ||
      (await InspectionRepository.findById(inspectionId));

    if (!inspection) {
      throw new Error(`Inspection not found: ${inspectionId}`);
    }

    const doc = inspection.toObject ? inspection.toObject() : inspection;
    const currentField = doc.fields?.[fieldName] || {};
    const oldValue = currentField.normalizedValue || currentField.rawValue || null;

    const reviewEvent = {
      fieldName,
      oldValue,
      newValue,
      reason,
      reviewerId: reviewer?.id || reviewer?._id || "LEGAL_METROLOGY_OFFICER",
      reviewerRole: reviewer?.role || "LEGAL_METROLOGY_OFFICER",
      reviewedAt: new Date().toISOString(),
    };

    // Update field value
    const updatedFields = { ...doc.fields };
    updatedFields[fieldName] = {
      ...(updatedFields[fieldName] || {}),
      fieldName,
      label: fieldName.replace(/([A-Z])/g, " $1").trim(),
      rawValue: String(newValue),
      normalizedValue: String(newValue),
      confidence: 1.0,
      status: "valid",
    };

    // Forward to AI service session audit log using canonical inspection ID
    const canonicalId = doc.inspectionId || inspectionId;
    try {
      const aiReviewRes = await submitHumanReviewViaAI(
        canonicalId,
        fieldName,
        String(newValue),
        reason,
        reviewEvent.reviewerRole,
        requestId
      );
      reviewEvent.aiSync = { status: "SYNCED", eventId: aiReviewRes?.event?.audit_event_id };
    } catch (aiErr) {
      console.warn(`AI service review sync note for ${canonicalId}:`, aiErr.message);
      reviewEvent.aiSync = { status: "LOCAL_ONLY", reason: aiErr.message };
    }

    // Determine updated compliance status:
    // If all mandatory fields have values, mark COMPLIANT
    const mandatoryFields = [
      "mrp",
      "netQuantity",
      "manufactureDate",
      "manufacturer",
      "consumerCare",
      "genericName",
    ];

    const allMandatoryFound = mandatoryFields.every((f) => {
      const val = updatedFields[f]?.normalizedValue;
      return val && String(val).trim().length > 0;
    });

    const newStatus = allMandatoryFound ? "COMPLIANT" : doc.status;

    // Filter out violation related to this field
    const remainingViolations = (doc.compliance?.violations || []).filter((v) => {
      const vMsg = (typeof v === "string" ? v : v.message || v.rule_name || "").toLowerCase();
      const fNameLower = fieldName.toLowerCase();
      return !vMsg.includes(fNameLower);
    });

    const updatedCompliance = {
      ...(doc.compliance || {}),
      overallStatus: newStatus,
      violations: remainingViolations,
    };

    const updatePayload = {
      status: newStatus,
      fields: updatedFields,
      compliance: updatedCompliance,
      humanReview: [...(doc.humanReview || []), reviewEvent],
      finalResult: {
        status: newStatus,
        fields: updatedFields,
        reviewedAt: reviewEvent.reviewedAt,
        reviewerId: reviewEvent.reviewerId,
      },
    };

    const updated = await InspectionRepository.findByIdAndUpdate(
      doc.inspectionId || doc._id,
      updatePayload,
      { new: true }
    );

    return {
      event: reviewEvent,
      inspection: formatInspectionForFrontend(updated),
    };
  }
}
