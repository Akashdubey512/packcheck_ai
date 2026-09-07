import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DashboardMetrics } from '@/types/dashboard';
import { buildRoute, ROUTES } from '@/constants/routes';
import { Activity, ArrowRight, ExternalLink } from 'lucide-react';

interface RecentInspectionsProps {
  recentActivity: DashboardMetrics['recentActivity'];
}

export const RecentInspections: React.FC<RecentInspectionsProps> = ({ recentActivity }) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <CardTitle className="text-xs uppercase tracking-wider">
              Recent Statutory Inspections
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 text-primary"
            onClick={() => navigate(ROUTES.HISTORY)}
          >
            All Audit Records <ArrowRight size={13} className="ml-1" />
          </Button>
        </div>
        <CardDescription>
          Live inspection pipeline activity feed with direct links to full evidence assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {recentActivity.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded border border-border bg-surface hover:bg-surface-muted/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} size="sm" />
                <span className="font-semibold text-foreground">{item.title}</span>
              </div>
              <div className="text-2xs text-slate-500 font-mono">
                Operator: {item.actor} • {item.timestamp}
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-2xs shrink-0 self-start sm:self-auto"
              onClick={() => {
                // Link directly to the sample result or history
                if (item.status === 'violation') {
                  navigate(buildRoute.scanDetail('scn_sample_cereal_violations'));
                } else {
                  navigate(buildRoute.scanDetail('scn_sample_dairy_compliant'));
                }
              }}
            >
              <ExternalLink size={12} className="mr-1" /> View Inspection
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
