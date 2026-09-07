import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Violation } from '@/types/compliance';
import { AlertOctagon, Target, Scale, ShieldAlert, ArrowRight } from 'lucide-react';

interface ViolationCardProps {
  violation: Violation;
  onFocusRegion?: (boundingBox: Violation['boundingBox'], fieldRef?: string) => void;
  onViewTrace?: (ruleId: string) => void;
  isSelected?: boolean;
}

export const ViolationCard: React.FC<ViolationCardProps> = ({
  violation,
  onFocusRegion,
  onViewTrace,
  isSelected = false,
}) => {
  const severityBadge = {
    critical: 'bg-red-700 text-white font-bold',
    high: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
    low: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
  }[violation.severity];

  return (
    <Card
      className={`border-2 transition-all text-left ${
        isSelected
          ? 'border-violation bg-violation-surface/40 ring-2 ring-violation/20 shadow-md'
          : 'border-violation-border hover:border-violation bg-surface'
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-violation-surface text-violation">
              <AlertOctagon size={16} />
            </div>
            <span className={`text-2xs font-mono uppercase px-2 py-0.5 rounded border ${severityBadge}`}>
              {violation.severity} Infraction
            </span>
          </div>
          <StatusBadge status="violation" label="Statutory Failure" size="sm" />
        </div>
        <CardTitle className="text-sm font-bold text-foreground mt-2 leading-snug">
          {violation.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 pt-0 text-xs">
        {/* Violation Description */}
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          {violation.description}
        </p>

        {/* Legal Clause Breached */}
        <div className="p-2.5 rounded bg-surface-muted border border-border/80 text-2xs space-y-1">
          <div className="flex items-center gap-1 text-slate-500 font-semibold uppercase tracking-wider">
            <Scale size={12} />
            Statutory Legal Clause Breached:
          </div>
          <div className="font-mono text-foreground font-medium">
            {violation.legalClause}
          </div>
        </div>

        {/* Recommended Statutory Corrective Action */}
        <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-2xs text-amber-900 dark:text-amber-300 space-y-1">
          <div className="flex items-center gap-1 font-semibold uppercase tracking-wider">
            <ShieldAlert size={12} />
            Mandatory Corrective Action:
          </div>
          <p className="leading-relaxed font-sans">{violation.recommendedAction}</p>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 bg-surface-subtle/40">
        <Button
          type="button"
          size="sm"
          variant="primary"
          className="text-xs"
          onClick={() => onFocusRegion && onFocusRegion(violation.boundingBox)}
        >
          <Target size={13} className="mr-1" /> Focus Evidence on Label
        </Button>

        {onViewTrace && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => onViewTrace(violation.ruleId)}
          >
            Decision Trace <ArrowRight size={13} className="ml-1" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
