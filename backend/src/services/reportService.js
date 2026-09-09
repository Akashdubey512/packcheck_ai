import { fetchReportPdfViaAI } from "./aiClient.js";
import { generateReportPdf } from "../utils/pdfGenerator.js";
import InspectionRepository from "../models/Inspection.js";

export class ReportService {
  /**
   * Stream or generate official compliance report PDF.
   */
  static async getInspectionReportPdf(inspectionId) {
    const doc =
      (await InspectionRepository.findOne({ inspectionId })) ||
      (await InspectionRepository.findById(inspectionId));

    if (!doc) {
      throw new Error(`Inspection not found: ${inspectionId}`);
    }

    // Try AI Service official ReportLab PDF certificate first
    try {
      const payload = doc.aiResult || {
        inspection_id: doc.inspectionId,
        overall_status: doc.status,
        views_analyzed: doc.images?.length || 1,
        fields: doc.fields,
        compliance_result: doc.compliance,
      };
      const pdfBuffer = await fetchReportPdfViaAI(doc.inspectionId || inspectionId, payload);
      if (pdfBuffer && pdfBuffer.length > 0) {
        return {
          buffer: pdfBuffer,
          filename: `Legal_Metrology_Inspection_${doc.inspectionId}.pdf`,
          contentType: "application/pdf",
        };
      }
    } catch (aiErr) {
      console.warn("AI PDF retrieval fallback to local generator:", aiErr.message);
    }

    // Fallback to local PDF generator
    const localBuffer = await generateReportPdf(doc);
    return {
      buffer: localBuffer,
      filename: `report-${doc.inspectionId}.pdf`,
      contentType: "application/pdf",
    };
  }
}
