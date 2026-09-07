import { z } from 'zod';
import { boundingBoxSchema, productSchema } from './scan.schema';

export const complianceStatusSchema = z.enum(['compliant', 'violation', 'review', 'info']);
export const severityLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

export const complianceCheckSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  ruleName: z.string(),
  ruleCategory: z.enum(['packaging', 'labeling', 'ingredients', 'statutory', 'pricing', 'origin']),
  status: complianceStatusSchema,
  severity: severityLevelSchema,
  message: z.string(),
  legalReference: z.string(),
  confidenceScore: z.number().min(0).max(1),
  decisionTraceId: z.string().optional(),
  fieldReference: z.string().optional(),
});

export const violationSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  title: z.string(),
  description: z.string(),
  severity: severityLevelSchema,
  status: complianceStatusSchema,
  boundingBox: boundingBoxSchema.optional(),
  legalClause: z.string(),
  recommendedAction: z.string(),
  timestamp: z.string(),
});

export const complianceReportSchema = z.object({
  id: z.string(),
  scanId: z.string(),
  generatedAt: z.string(),
  generatedBy: z.string(),
  overallStatus: complianceStatusSchema,
  totalChecks: z.number(),
  passedChecks: z.number(),
  failedChecks: z.number(),
  reviewChecks: z.number(),
  violations: z.array(violationSchema),
  checks: z.array(complianceCheckSchema),
  productInfo: productSchema,
  summary: z.string(),
  digitalSignature: z.string().optional(),
  reportUrl: z.string().optional(),
});
