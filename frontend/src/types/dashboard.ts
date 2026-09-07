import { ComplianceStatus } from './compliance';

export interface CategoryMetric {
  category: string;
  total: number;
  compliant: number;
  violations: number;
  rate: number;
}

export interface TimelineMetric {
  date: string; // YYYY-MM-DD
  total: number;
  compliant: number;
  violations: number;
}

export interface DashboardMetrics {
  totalScans: number; // Total Inspections
  compliantCount: number; // Compliant count
  nonCompliantCount: number; // Non-Compliant count
  reviewRequiredCount: number; // Review Required count
  complianceRate: number; // overall percentage e.g. 96.4
  activeViolations: number;
  pendingReviews: number;
  scansToday: number;
  criticalAlertsCount: number;
  scansByCategory: CategoryMetric[];
  scansTimeline: TimelineMetric[];
  recentActivity: Array<{
    id: string;
    type: 'scan' | 'verification' | 'report';
    title: string;
    timestamp: string;
    status: ComplianceStatus;
    actor: string;
  }>;
}
