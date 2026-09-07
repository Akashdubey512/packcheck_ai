import { z } from 'zod';

export const boundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const ocrRegionSchema = z.object({
  id: z.string(),
  boundingBox: boundingBoxSchema,
  confidence: z.number().min(0).max(1),
  detectedText: z.string(),
  orientation: z.number().optional(),
  pageNumber: z.number().optional(),
});

export const extractedFieldSchema = z.object({
  fieldName: z.string(),
  label: z.string(),
  rawValue: z.string(),
  normalizedValue: z.string(),
  confidence: z.number().min(0).max(1),
  status: z.enum(['valid', 'invalid', 'uncertain', 'missing']),
  ocrRegionId: z.string().optional(),
  sourceLocation: boundingBoxSchema.optional(),
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  gtin: z.string(),
  manufacturer: z.string(),
  category: z.string(),
  batchNumber: z.string().optional(),
  mfgDate: z.string().optional(),
  expDate: z.string().optional(),
  netWeight: z.string().optional(),
  fssaiLicenseNumber: z.string().optional(),
});

export const scanStatusSchema = z.enum([
  'IDLE',
  'UPLOADING',
  'READY',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

export const scanSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  fileUrl: z.string(),
  status: scanStatusSchema,
  uploadedAt: z.string(),
  processedAt: z.string().optional(),
  product: productSchema.optional(),
  ocrRegions: z.array(ocrRegionSchema),
  extractedFields: z.array(extractedFieldSchema),
  complianceVerdict: z.enum(['compliant', 'violation', 'review', 'info']).optional(),
  overallScore: z.number().min(0).max(100).optional(),
});

export const scanUploadResponseSchema = z.object({
  scanId: z.string(),
  status: scanStatusSchema,
  fileUrl: z.string(),
  message: z.string(),
});
