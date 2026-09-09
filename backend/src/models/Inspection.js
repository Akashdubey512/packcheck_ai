import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const inspectionSchema = new mongoose.Schema(
  {
    inspectionId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["PROCESSING", "COMPLIANT", "NON_COMPLIANT", "REVIEW_REQUIRED", "AI_FAILED"],
      default: "PROCESSING",
      index: true,
    },
    requestId: { type: String, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    images: [
      {
        imageId: String,
        url: String,
        filename: String,
        viewType: { type: String, default: "UNKNOWN" },
        qualityStatus: { type: String, default: "UNKNOWN" },
        originalName: String,
        mimeType: String,
        size: Number,
      },
    ],
    imageMetadata: {
      viewsAnalyzed: { type: Number, default: 0 },
      inspectedViews: [String],
      coverageStatus: { type: String, default: "UNKNOWN_COVERAGE" },
    },
    ocr: {
      fullRawText: { type: String, default: "" },
      regions: [
        {
          id: String,
          boundingBox: { x: Number, y: Number, width: Number, height: Number },
          confidence: Number,
          detectedText: String,
          pageNumber: Number,
        },
      ],
    },
    fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    regulatoryDeclarations: { type: mongoose.Schema.Types.Mixed, default: {} },
    compliance: {
      overallStatus: { type: String, default: "UNKNOWN" },
      ruleEvaluations: { type: Array, default: [] },
      violations: { type: Array, default: [] },
      warnings: { type: Array, default: [] },
    },
    contradictions: [
      {
        fieldName: String,
        viewA: String,
        valueA: String,
        viewB: String,
        valueB: String,
        description: String,
        severity: { type: String, default: "high" },
      },
    ],
    evidence: [
      {
        id: String,
        type: { type: String, default: "ocr_crop" },
        assetUrl: String,
        hashSha256: String,
        timestamp: String,
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
    aiResult: { type: mongoose.Schema.Types.Mixed, default: null },
    humanReview: [
      {
        fieldName: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        reason: String,
        reviewerId: String,
        reviewerRole: { type: String, default: "LEGAL_METROLOGY_OFFICER" },
        reviewedAt: { type: Date, default: Date.now },
      },
    ],
    finalResult: { type: mongoose.Schema.Types.Mixed, default: null },
    provenance: {
      sha256Hashes: [String],
      modelVersion: { type: String, default: "1.2.3" },
      ruleVersion: { type: String, default: "PCR-2011.v2" },
      executionTimeMs: Number,
    },
  },
  { timestamps: true }
);

// Mongoose Model
export const MongooseInspection = mongoose.model("Inspection", inspectionSchema);

// In-Memory / File-based resilient storage for when MongoDB is disconnected
const inMemoryStore = new Map();
const STORAGE_FILE = path.resolve("./uploads/.inspections_store.json");

// Load existing persisted offline records if available
if (fs.existsSync(STORAGE_FILE)) {
  try {
    const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    parsed.forEach((doc) => inMemoryStore.set(doc.inspectionId || doc._id, doc));
  } catch (err) {
    console.warn("Could not load local offline inspection store:", err.message);
  }
}

function persistStoreToDisk() {
  try {
    const arr = Array.from(inMemoryStore.values());
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(arr, null, 2), "utf-8");
  } catch {
    // Silently ignore disk write issues in read-only environments
  }
}

class InspectionDocument {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id) this._id = this.inspectionId || `insp_${Date.now()}`;
    if (!this.createdAt) this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    inMemoryStore.set(this.inspectionId || this._id, this);
    persistStoreToDisk();
    return this;
  }

  toObject() {
    return { ...this };
  }
}

export class InspectionRepository {
  static isMongoConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
  }

  static async create(data) {
    if (this.isMongoConnected()) {
      return await MongooseInspection.create(data);
    }
    const doc = new InspectionDocument(data);
    await doc.save();
    return doc;
  }

  static async findById(id) {
    if (this.isMongoConnected()) {
      return await MongooseInspection.findById(id);
    }
    const doc = inMemoryStore.get(id);
    return doc ? new InspectionDocument(doc) : null;
  }

  static async findOne(query) {
    if (this.isMongoConnected()) {
      return await MongooseInspection.findOne(query);
    }
    for (const doc of inMemoryStore.values()) {
      let match = true;
      for (const [key, val] of Object.entries(query)) {
        if (doc[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) return new InspectionDocument(doc);
    }
    return null;
  }

  static async find(query = {}, options = {}) {
    if (this.isMongoConnected()) {
      let q = MongooseInspection.find(query);
      if (options.sort) q = q.sort(options.sort);
      if (options.skip) q = q.skip(options.skip);
      if (options.limit) q = q.limit(options.limit);
      return await q.exec();
    }
    let docs = Array.from(inMemoryStore.values());
    if (Object.keys(query).length > 0) {
      docs = docs.filter((doc) => {
        for (const [k, v] of Object.entries(query)) {
          if (doc[k] !== v) return false;
        }
        return true;
      });
    }
    docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const skip = options.skip || 0;
    const limit = options.limit || docs.length;
    return docs.slice(skip, skip + limit).map((d) => new InspectionDocument(d));
  }

  static async countDocuments(query = {}) {
    if (this.isMongoConnected()) {
      return await MongooseInspection.countDocuments(query);
    }
    if (Object.keys(query).length === 0) return inMemoryStore.size;
    let count = 0;
    for (const doc of inMemoryStore.values()) {
      let match = true;
      for (const [k, v] of Object.entries(query)) {
        if (doc[k] !== v) {
          match = false;
          break;
        }
      }
      if (match) count++;
    }
    return count;
  }

  static async findByIdAndUpdate(id, update, options = { new: true }) {
    if (this.isMongoConnected()) {
      return await MongooseInspection.findByIdAndUpdate(id, update, options);
    }
    let doc = inMemoryStore.get(id);
    if (!doc) return null;
    const updatedData = { ...doc, ...update, updatedAt: new Date().toISOString() };
    const newDoc = new InspectionDocument(updatedData);
    await newDoc.save();
    return newDoc;
  }
}

export default InspectionRepository;
