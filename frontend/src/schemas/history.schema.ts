import { z } from 'zod';
import { complianceStatusSchema } from './compliance.schema';

export const historyItemSchema = z.object({
  id: z.string(),
  scanId: z.string(),
  productName: z.string(),
  gtin: z.string(),
  status: complianceStatusSchema,
  timestamp: z.string(),
  violationCount: z.number(),
  complianceScore: z.number().min(0).max(100),
  scannedBy: z.string(),
  category: z.string(),
  batchNumber: z.string().optional(),
});

export const historyResponseSchema = z.object({
  items: z.array(historyItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});
