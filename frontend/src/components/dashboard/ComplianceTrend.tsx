import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { TimelineMetric } from '@/types/dashboard';
import { TrendingUp, Calendar } from 'lucide-react';

interface ComplianceTrendProps {
  timeline: TimelineMetric[];
}

export const ComplianceTrend: React.FC<ComplianceTrendProps> = ({ timeline }) => {
  const maxDaily = Math.max(...timeline.map((d) => d.total), 300);

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <CardTitle className="text-xs uppercase tracking-wider">
              Compliance Inspection Trends (Last 7 Days)
            </CardTitle>
          </div>
          <div className="flex items-center gap-3 text-2xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-compliant inline-block" /> Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-violation inline-block" /> Violations
            </span>
          </div>
        </div>
        <CardDescription>
          Daily inspection throughput and statutory infraction distribution
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4 pb-1">
          {timeline.map((day) => {
            const compliantHeight = Math.round((day.compliant / maxDaily) * 100);
            const violationHeight = Math.max(Math.round((day.violations / maxDaily) * 100), 4);
            const dayFormatted = day.date.slice(5); // MM-DD

            return (
              <div key={day.date} className="flex flex-col items-center gap-1 h-full justify-end group">
                <div className="text-[10px] font-mono font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.total}
                </div>
                <div className="w-full max-w-[38px] rounded-t flex flex-col justify-end bg-surface-muted overflow-hidden border border-border h-32">
                  <div
                    className="w-full bg-compliant transition-all duration-300"
                    style={{ height: `${compliantHeight}%` }}
                    title={`Compliant: ${day.compliant}`}
                  />
                  <div
                    className="w-full bg-violation transition-all duration-300"
                    style={{ height: `${violationHeight}%` }}
                    title={`Violations: ${day.violations}`}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-0.5">
                  <Calendar size={9} className="opacity-60" />
                  {dayFormatted}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
