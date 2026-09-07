import React, { useEffect, useState, useCallback } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import {
  ComplianceOverview,
  ComplianceTrend,
  ViolationDistribution,
  RecentInspections,
  DashboardSkeleton,
} from '@/components/dashboard';
import { DashboardService } from '@/services/dashboardService';
import { DashboardMetrics } from '@/types/dashboard';
import { RotateCw, AlertTriangle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(() => {
    setLoading(true);
    setError(null);
    DashboardService.getMetrics()
      .then((data) => setMetrics(data))
      .catch(() => setError('Failed to communicate with national compliance analytics service.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <PageShell
      title="Compliance Overview & Analytics"
      description="Consolidated packaging compliance rates, inspection volume trends, and statutory infraction alerts."
      badge={<StatusBadge status="compliant" customText="Live Telemetry" size="sm" />}
      actions={
        <Button size="sm" variant="outline" onClick={fetchMetrics} disabled={loading}>
          <RotateCw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Metrics
        </Button>
      }
    >
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="p-12 text-center rounded border border-violation-border bg-violation-surface text-violation-foreground space-y-3">
          <AlertTriangle size={24} className="mx-auto" />
          <div className="font-semibold text-sm">{error}</div>
          <Button size="sm" variant="outline" onClick={fetchMetrics}>
            Retry Connection
          </Button>
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* 1. Stat Cards Overview */}
          <ComplianceOverview metrics={metrics} />

          {/* 2. Charts: 7-Day Trend & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <ComplianceTrend timeline={metrics.scansTimeline} />
            <ViolationDistribution categories={metrics.scansByCategory} />
          </div>

          {/* 3. Live Inspections Stream */}
          <RecentInspections recentActivity={metrics.recentActivity} />
        </div>
      ) : null}
    </PageShell>
  );
};
