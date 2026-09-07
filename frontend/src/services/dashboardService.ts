import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isDemoMode } from '@/app/config/env';
import { DashboardMetrics } from '@/types/dashboard';

export const DashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        totalScans: 14820,
        compliantCount: 14288,
        nonCompliantCount: 498,
        reviewRequiredCount: 34,
        complianceRate: 96.4,
        activeViolations: 18,
        pendingReviews: 34,
        scansToday: 245,
        criticalAlertsCount: 3,
        scansByCategory: [
          { category: 'Dairy Products', total: 4200, compliant: 4080, violations: 120, rate: 97.1 },
          { category: 'Packaged Snacks', total: 3850, compliant: 3620, violations: 230, rate: 94.0 },
          { category: 'Beverages', total: 3100, compliant: 3010, violations: 90, rate: 97.0 },
          { category: 'Edible Oils', total: 2150, compliant: 2090, violations: 60, rate: 97.2 },
          { category: 'Infant Nutrition', total: 1520, compliant: 1515, violations: 5, rate: 99.6 },
        ],
        scansTimeline: [
          { date: '2026-09-01', total: 210, compliant: 202, violations: 8 },
          { date: '2026-09-02', total: 240, compliant: 231, violations: 9 },
          { date: '2026-09-03', total: 195, compliant: 188, violations: 7 },
          { date: '2026-09-04', total: 265, compliant: 254, violations: 11 },
          { date: '2026-09-05', total: 230, compliant: 222, violations: 8 },
          { date: '2026-09-06', total: 180, compliant: 174, violations: 6 },
          { date: '2026-09-07', total: 245, compliant: 238, violations: 7 },
        ],
        recentActivity: [
          {
            id: 'act_1',
            type: 'scan',
            title: 'Scan completed: Fortified Multi-Grain Flakes',
            timestamp: '10 minutes ago',
            status: 'compliant',
            actor: 'System / Automated Pipeline',
          },
          {
            id: 'act_2',
            type: 'verification',
            title: 'Batch Hash Verified: LOT-2026-X89',
            timestamp: '25 minutes ago',
            status: 'compliant',
            actor: 'Auditor Verification Service',
          },
          {
            id: 'act_3',
            type: 'report',
            title: 'Regulatory Infraction Notice Generated',
            timestamp: '1 hour ago',
            status: 'violation',
            actor: 'Enforcement Bureau',
          },
        ],
      };
    }

    return apiClient.get<DashboardMetrics>(API_ENDPOINTS.DASHBOARD.METRICS);
  },
};
