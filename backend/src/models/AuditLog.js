import mongoose from "mongoose";
import crypto from "crypto";

const auditLogSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    requestId: { type: String, required: true, index: true },
    inspectionId: { type: String, required: true, index: true },
    actorId: { type: String, required: true, default: "system" },
    actorRole: { type: String, required: true, default: "SYSTEM" },
    action: {
      type: String,
      required: true,
      enum: [
        "INSPECTION_CREATED",
        "AI_EVALUATION_COMPLETED",
        "REVIEW_OVERRIDE_APPLIED",
        "REPORT_GENERATED",
        "STATUS_TRANSITION",
        "AUTH_FAILURE",
        "SECURITY_ALERT",
      ],
    },
    timestamp: { type: Date, default: Date.now },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    previousState: { type: mongoose.Schema.Types.Mixed, default: null },
    newState: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

// Offline memory repository fallback when MongoDB is disconnected
const inMemoryAuditLogs = [];

export const AuditLogModel =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export class AuditLogRepository {
  static async create(logData) {
    const record = {
      eventId: logData.eventId || `evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      requestId: logData.requestId || "req_unknown",
      inspectionId: logData.inspectionId || "global",
      actorId: logData.actorId || "system",
      actorRole: logData.actorRole || "SYSTEM",
      action: logData.action,
      timestamp: logData.timestamp || new Date(),
      details: logData.details || {},
      previousState: logData.previousState || null,
      newState: logData.newState || null,
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await AuditLogModel.create(record);
        return doc.toObject();
      } catch (err) {
        // Fall back to memory on DB write failure
        inMemoryAuditLogs.push(record);
        return record;
      }
    } else {
      inMemoryAuditLogs.push(record);
      return record;
    }
  }

  static async findByInspectionId(inspectionId) {
    if (mongoose.connection.readyState === 1) {
      try {
        return await AuditLogModel.find({ inspectionId }).sort({ timestamp: 1 }).lean();
      } catch {
        return inMemoryAuditLogs.filter((l) => l.inspectionId === inspectionId);
      }
    }
    return inMemoryAuditLogs.filter((l) => l.inspectionId === inspectionId);
  }

  static clearMemory() {
    inMemoryAuditLogs.length = 0;
  }
}
