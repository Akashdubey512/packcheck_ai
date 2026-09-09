import React from 'react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ComplianceCheck } from '@/types/compliance';
import { Target, Hash, CheckCircle2 } from 'lucide-react';

interface ChecklistItemProps {
  check: ComplianceCheck;
  isSelected?: boolean;
  onSelect: () => void;
  onFocusRegion?: () => void;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  check,
  isSelected = false,
  onSelect,
  onFocusRegion,
}) => {
  return (
    <Card
      onClick={onSelect}
      className={`p-3.5 border transition-all cursor-pointer text-left ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 bg-surface-muted shadow-sm'
          : 'border-border hover:border-slate-400 dark:hover:border-slate-600 bg-surface'
      }`}
    >
      <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={check.status} size="sm" />
            <span className="text-2xs font-mono text-slate-400 uppercase">
              {check.ruleCategory}
            </span>
          </div>
          <h4 className="text-xs font-semibold text-foreground leading-snug break-words">
            {check.ruleName}
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <div className="text-right">
            <span className="text-2xs text-slate-500 block">Extraction Conf.</span>
            <span className="text-xs font-mono font-bold text-foreground flex items-center gap-1 justify-end">
              <CheckCircle2 size={11} className="text-primary" />
              {(check.confidenceScore * 100).toFixed(0)}%
            </span>
          </div>

          {onFocusRegion && (
            <Button
              type="button"
              size="sm"
              variant={isSelected ? 'primary' : 'outline'}
              className="h-8 text-2xs px-2.5"
              onClick={(e) => {
                e.stopPropagation();
                onFocusRegion();
              }}
            >
              <Target size={12} className="mr-1" /> Focus
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-2xs text-slate-500">
        <span className="font-mono truncate max-w-md">
          <Hash size={11} className="inline mr-1 text-slate-400" />
          {check.legalReference}
        </span>
        <span className="font-semibold uppercase text-slate-600 dark:text-slate-400">
          {check.severity} Severity
        </span>
      </div>
    </Card>
  );
};
