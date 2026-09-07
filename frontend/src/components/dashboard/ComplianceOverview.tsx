import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { DashboardMetrics } from '@/types/dashboard';
import { Activity, CheckCircle2, AlertOctagon, Clock } from 'lucide-react';

interface ComplianceOverviewProps {
  metrics: DashboardMetrics;
}

export const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({ metrics }) => {
  const compliantCount = metrics.compliantCount ?? Math.round((metrics.totalScans * metrics.complianceRate) / 100);
  const nonCompliantCount = metrics.nonCompliantCount ?? metrics.activeViolations;
  const reviewCount = metrics.reviewRequiredCount ?? metrics.pendingReviews;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Inspections */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
              Total Inspections
            </span>
            <div className="text-2xl font-bold font-mono text-foreground mt-1">
              {metrics.totalScans.toLocaleString()}
            </div>
            <span className="text-2xs text-slate-500 font-mono">
              +{metrics.scansToday} recorded today
            </span>
          </div>
          <div className="p-2.5 rounded bg-surface-muted text-foreground border border-border">
            <Activity size={20} />
          </div>
        </CardContent>
      </Card>

      {/* 2. Compliant */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
              Compliant
            </span>
            <div className="text-2xl font-bold font-mono text-compliant mt-1">
              {compliantCount.toLocaleString()}
            </div>
            <span className="text-2xs text-compliant-foreground font-mono">
              {metrics.complianceRate}% compliance rate
            </span>
          </div>
          <div className="p-2.5 rounded bg-compliant-surface text-compliant border border-compliant-border">
            <CheckCircle2 size={20} />
          </div>
        </CardContent>
      </Card>

      {/* 3. Non-Compliant */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
              Non-Compliant
            </span>
            <div className="text-2xl font-bold font-mono text-violation mt-1">
              {nonCompliantCount.toLocaleString()}
            </div>
            <span className="text-2xs text-violation-foreground font-mono">
              Statutory infractions
            </span>
          </div>
          <div className="p-2.5 rounded bg-violation-surface text-violation border border-violation-border">
            <AlertOctagon size={20} />
          </div>
        </CardContent>
      </Card>

      {/* 4. Review Required */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
              Review Required
            </span>
            <div className="text-2xl font-bold font-mono text-review mt-1">
              {reviewCount.toLocaleString()}
            </div>
            <span className="text-2xs text-review-foreground font-mono">
              Pending review sign-off
            </span>
          </div>
          <div className="p-2.5 rounded bg-review-surface text-review border border-review-border">
            <Clock size={20} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
