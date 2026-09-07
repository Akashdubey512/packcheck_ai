import { z } from 'zod';
import { complianceStatusSchema } from './compliance.schema';

export const batchRecordSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  productGtin: z.string(),
  productName: z.string(),
  unitCount: z.number(),
  complianceStatus: complianceStatusSchema,
  timestamp: z.string(),
  verificationHash: z.string(),
  operatorId: z.string(),
  facilityLocation: z.string(),
});

export const verificationResultSchema = z.object({
  batchId: z.string(),
  verifiedAt: z.string(),
  isValid: z.boolean(),
  cryptographicProof: z.string(),
  matchesRegistry: z.boolean(),
  ledgerTimestamp: z.string(),
  violationsCount: z.number(),
  recordsCount: z.number(),
  issuerAuthority: z.string(),
  digitalCertificateId: z.string(),
});
