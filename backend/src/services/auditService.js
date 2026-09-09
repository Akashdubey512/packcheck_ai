import { AuditLogRepository } from "../models/AuditLog.js";

/**
 * Audit service for writing immutable provenance and action events.
 */
export class AuditService {
  /**
   * Log a system or user action.
   */
  static async recordEvent(eventPayload) {
    try {
      const record = await AuditLogRepository.create({
        requestId: eventPayload.requestId || "req_system",
        inspectionId: eventPayload.inspectionId || "global",
        actorId: eventPayload.actorId || eventPayload.user?.id || "system",
        actorRole: eventPayload.actorRole || eventPayload.user?.role || "SYSTEM",
        action: eventPayload.action,
        details: eventPayload.details || {},
        previousState: eventPayload.previousState || null,
        newState: eventPayload.newState || null,
        timestamp: new Date(),
      });
      return record;
    } catch (err) {
      console.error("Failed to write audit log event:", err.message);
      return null;
    }
  }

  /**
   * Fetch audit trail history for a given inspection.
   */
  static async getInspectionTrail(inspectionId) {
    return await AuditLogRepository.findByInspectionId(inspectionId);
  }
}
