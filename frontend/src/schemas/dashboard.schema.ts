import { z } from 'zod';
import { complianceStatusSchema } from './compliance.schema';

export const categoryMetricSchema = z.object({
  category: z.string(),
  total: z.number(),
  compliant: z.number(),
  violations: z.number(),
  rate: z.number(),
});

export const timelineMetricSchema = z.object({
  date: z.string(),
  total: z.number(),
  compliant: z.number(),
  violations: z.number(),
});

export const recentActivityItemSchema = z.object({
  id: z.string(),
  type: z.enum(['scan', 'verification', 'report']),
  title: z.string(),
  timestamp: z.string(),
  status: complianceStatusSchema,
  actor: z.string(),
});

export const dashboardMetricsSchema = z.object({
  totalScans: z.number(),
  complianceRate: z.number(),
  activeViolations: z.number(),
  pendingReviews: z.number(),
  scansToday: z.number(),
  criticalAlertsCount: z.number(),
  scansByCategory: z.array(categoryMetricSchema),
  scansTimeline: z.array(timelineMetricSchema),
  recentActivity: z.array(recentActivityItemSchema),
});
