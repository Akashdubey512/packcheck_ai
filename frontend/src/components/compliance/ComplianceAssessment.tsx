import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ChecklistItem } from './ChecklistItem';
import { ViolationCard } from './ViolationCard';
import { ComplianceCheck, Violation, ComplianceStatus } from '@/types/compliance';
import { ShieldCheck, AlertOctagon, Clock, Search } from 'lucide-react';

interface ComplianceAssessmentProps {
  overallStatus: ComplianceStatus;
  score: number;
  checks: ComplianceCheck[];
  violations: Violation[];
  selectedCheckId: string | null;
  onSelectCheck: (check: ComplianceCheck) => void;
  onFocusRegion: (boundingBox: Violation['boundingBox'], fieldRef?: string) => void;
  onViewTrace: (traceId: string) => void;
}

type FilterTab = 'all' | 'violation' | 'review' | 'compliant';

export const ComplianceAssessment: React.FC<ComplianceAssessmentProps> = ({
  overallStatus,
  score,
  checks = [],
  violations = [],
  selectedCheckId,
  onSelectCheck,
  onFocusRegion,
  onViewTrace,
}) => {
  const safeScore = typeof score === 'number' && isFinite(score) ? score : 0;
  const safeChecks = Array.isArray(checks) ? checks : [];
  const safeViolations = Array.isArray(violations) ? violations : [];
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Counts
  const violationCount = safeChecks.filter((c) => c.status === 'violation').length;
  const reviewCount = safeChecks.filter((c) => c.status === 'review').length;
  const compliantCount = safeChecks.filter((c) => c.status === 'compliant').length;

  const filteredChecks = useMemo(() => {
    return safeChecks.filter((check) => {
      const matchesTab = activeTab === 'all' || check.status === activeTab;
      const matchesSearch =
        !searchQuery.trim() ||
        (check.ruleName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (check.legalReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (check.ruleCategory || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [safeChecks, activeTab, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Master Verdict Summary Banner */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500 block">
                Statutory Assessment Summary
              </span>
              <div className="flex items-center gap-3 mt-1">
                <StatusBadge status={overallStatus} size="lg" />
                <div className="font-mono text-xl font-bold text-foreground">
                  Score: <span className={overallStatus === 'violation' ? 'text-violation' : 'text-compliant'}>{safeScore.toFixed(1)}/100</span>
                </div>
              </div>
            </div>

            {/* Quick Count Badges */}
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded bg-violation-surface border border-violation-border text-xs flex items-center gap-1.5 font-semibold text-violation">
                <AlertOctagon size={13} />
                <span>{violationCount} Violations</span>
              </div>
              <div className="px-2.5 py-1 rounded bg-review-surface border border-review-border text-xs flex items-center gap-1.5 font-semibold text-review">
                <Clock size={13} />
                <span>{reviewCount} Review</span>
              </div>
              <div className="px-2.5 py-1 rounded bg-compliant-surface border border-compliant-border text-xs flex items-center gap-1.5 font-semibold text-compliant">
                <ShieldCheck size={13} />
                <span>{compliantCount} Compliant</span>
              </div>
            </div>
          </div>
          <CardDescription className="pt-1">
            Evaluated under Legal Metrology (Packaged Commodities) Rules 2011 and FSSAI Labelling Regulations.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Critical Violations Alert Section (if any violations exist) */}
      {safeViolations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertOctagon size={15} className="text-violation" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Statutory Infractions Detected ({safeViolations.length})
            </h3>
          </div>

          <div className="space-y-3">
            {safeViolations.map((violation) => (
              <ViolationCard
                key={violation.id}
                violation={violation}
                onFocusRegion={(box) => onFocusRegion(box, violation.ruleId)}
                onViewTrace={(ruleId) => {
                  const matchingCheck = safeChecks.find((c) => c.ruleId === ruleId);
                  if (matchingCheck?.decisionTraceId) {
                    onViewTrace(matchingCheck.decisionTraceId);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Checklist Filter Tabs & Search */}
      <Card className="border border-border">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-xs uppercase tracking-wider">
              Statutory Declarations Checklist ({safeChecks.length})
            </CardTitle>

            <div className="relative sm:w-64">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter rules or clauses..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 text-xs rounded border font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-institutional-900 text-white dark:bg-sky-500/20 dark:text-sky-300 border-transparent font-semibold'
                  : 'bg-surface text-slate-600 dark:text-slate-400 border-border hover:bg-surface-muted'
              }`}
            >
              All ({safeChecks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('violation')}
              className={`px-2.5 py-1 text-xs rounded border font-medium transition-colors ${
                activeTab === 'violation'
                  ? 'bg-violation text-white border-transparent font-semibold'
                  : 'bg-surface text-slate-600 dark:text-slate-400 border-border hover:bg-surface-muted'
              }`}
            >
              Violations ({violationCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={`px-2.5 py-1 text-xs rounded border font-medium transition-colors ${
                activeTab === 'review'
                  ? 'bg-review text-white border-transparent font-semibold'
                  : 'bg-surface text-slate-600 dark:text-slate-400 border-border hover:bg-surface-muted'
              }`}
            >
              Review ({reviewCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compliant')}
              className={`px-2.5 py-1 text-xs rounded border font-medium transition-colors ${
                activeTab === 'compliant'
                  ? 'bg-compliant text-white border-transparent font-semibold'
                  : 'bg-surface text-slate-600 dark:text-slate-400 border-border hover:bg-surface-muted'
              }`}
            >
              Compliant ({compliantCount})
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          {filteredChecks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No statutory declarations match current filter criteria.
            </div>
          ) : (
            filteredChecks.map((check) => (
              <ChecklistItem
                key={check.id}
                check={check}
                isSelected={selectedCheckId === check.id}
                onSelect={() => onSelectCheck(check)}
                onFocusRegion={() => {
                  onSelectCheck(check);
                }}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
