import fs from "fs";
import Scan from "../models/Scan.js";
import { analyzeImage } from "../services/aiService.js";
import { generateReportPdf } from "../utils/pdfGenerator.js";

export async function createScan(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const { panelWidthCm, panelHeightCm } = req.body;

    // Read the saved file back off disk and convert to base64 for the AI service.
    // (We already validated + stored it via multer in the upload middleware.)
    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString("base64");

    let aiResult;
    try {
      aiResult = await analyzeImage(
        imageBase64,
        panelWidthCm ? Number(panelWidthCm) : undefined,
        panelHeightCm ? Number(panelHeightCm) : undefined
      );
    } catch (aiErr) {
      console.error("AI service call failed:", aiErr.message);
      return res.status(502).json({ error: "Analysis service unavailable. Please try again." });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const scan = await Scan.create({
      imageUrl,
      uploadedBy: req.user?.id, // present if requireAuth ran on this route
      declarations: aiResult.declarations,
      overallStatus: aiResult.overall_status,
      violations: aiResult.violations,
    });

    res.status(201).json({
      scanId: scan._id,
      imageUrl: scan.imageUrl,
      overallStatus: scan.overallStatus,
      declarations: scan.declarations,
      violations: scan.violations,
      createdAt: scan.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process scan" });
  }
}

export async function listScans(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { overallStatus: status } : {};

    const skip = (Number(page) - 1) * Number(limit);
    const [scans, total] = await Promise.all([
      Scan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Scan.countDocuments(filter),
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      scans: scans.map((s) => ({
        scanId: s._id,
        imageUrl: s.imageUrl,
        overallStatus: s.overallStatus,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch scans" });
  }
}

export async function getScanById(req, res) {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) return res.status(404).json({ error: "Scan not found" });

    res.json({
      scanId: scan._id,
      imageUrl: scan.imageUrl,
      overallStatus: scan.overallStatus,
      declarations: scan.declarations,
      violations: scan.violations,
      createdAt: scan.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch scan" });
  }
}

export async function getScanReport(req, res) {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) return res.status(404).json({ error: "Scan not found" });

    const pdfBuffer = await generateReportPdf(scan);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=report-${scan._id}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
}