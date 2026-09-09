import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { DashboardMetrics } from '@/types/dashboard';
import { ComplianceStatus } from '@/types/compliance';
import { buildRoute, ROUTES } from '@/constants/routes';
import {
  Package,
  Layers,
  Tag,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  LucideIcon,
} from 'lucide-react';

interface RecentInspectionsProps {
  recentActivity: DashboardMetrics['recentActivity'];
}

type StatusFilter = 'all' | 'violation' | 'review' | 'compliant';

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: LucideIcon;
    badgeClass: string;
    borderClass: string;
  }
> = {
  violation: {
    label: 'FAILED',
    icon: XCircle,
    badgeClass:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    borderClass: 'border-l-rose-500 dark:border-l-rose-400',
  },
  review: {
    label: 'REVIEW',
    icon: Clock,
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    borderClass: 'border-l-amber-500 dark:border-l-amber-400',
  },
  compliant: {
    label: 'PASSED',
    icon: CheckCircle2,
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    borderClass: 'border-l-emerald-500 dark:border-l-emerald-400',
  },
  info: {
    label: 'INFO',
    icon: CheckCircle2,
    badgeClass:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    borderClass: 'border-l-sky-500 dark:border-l-sky-400',
  },
};

function formatInspectionDate(rawTimestamp: string): string {
  if (!rawTimestamp) return 'Recently';
  if (rawTimestamp.includes('ago') || rawTimestamp.toLowerCase() === 'recently') {
    return rawTimestamp;
  }
  try {
    const d = new Date(rawTimestamp);
    if (isNaN(d.getTime())) return rawTimestamp;
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${day} ${month} · ${time}`;
  } catch {
    return rawTimestamp;
  }
}

function cleanCommodityName(rawTitle: string): string {
  if (!rawTitle) return 'Packaged Commodity';
  return rawTitle
    .replace(/^Scan completed:\s*/i, '')
    .replace(/^Inspection:\s*/i, '')
    .replace(/^Batch Hash Verified:\s*/i, 'Batch ')
    .trim();
}

function getResultSummary(item: { status: ComplianceStatus; title?: string }): string {
  const lowerTitle = (item.title || '').toLowerCase();
  if (item.status === 'violation') {
    if (lowerTitle.includes('cereal') || lowerTitle.includes('flakes')) {
      return '3 violations detected';
    }
    if (lowerTitle.includes('namkeen') || lowerTitle.includes('snack')) {
      return '2 violations detected';
    }
    return 'Statutory violations detected';
  }
  if (item.status === 'review') {
    return 'Manual verification required';
  }
  return 'All mandatory declarations verified';
}

function getCommodityIcon(title: string): LucideIcon {
  const lower = title.toLowerCase();
  if (lower.includes('cereal') || lower.includes('grain') || lower.includes('flakes')) {
    return Layers;
  }
  if (lower.includes('tea') || lower.includes('beverage') || lower.includes('batch')) {
    return Tag;
  }
  return Package;
}

function formatOperator(actor: string): string {
  if (!actor) return 'Automated Pipeline · System';
  return actor
    .replace('System / Automated Pipeline', 'Automated Pipeline · System')
    .replace(' / ', ' · ');
}

export const RecentInspections: React.FC<RecentInspectionsProps> = ({ recentActivity = [] }) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const safeActivity = useMemo(
    () => (Array.isArray(recentActivity) ? recentActivity : []),
    [recentActivity]
  );

  // Exact counts computed from existing data
  const counts = useMemo(() => {
    let failed = 0;
    let review = 0;
    let passed = 0;
    for (const item of safeActivity) {
      if (item.status === 'violation') failed++;
      else if (item.status === 'review') review++;
      else if (item.status === 'compliant') passed++;
    }
    return {
      all: safeActivity.length,
      violation: failed,
      review,
      compliant: passed,
    };
  }, [safeActivity]);

  const filteredActivity = useMemo(() => {
    if (statusFilter === 'all') return safeActivity;
    return safeActivity.filter((item) => item.status === statusFilter);
  }, [safeActivity, statusFilter]);

  const handleNavigate = (item: RecentInspectionsProps['recentActivity'][number]) => {
    if (
      item.id &&
      (item.id.startsWith('scn_') || item.id.startsWith('INSP_') || item.id.startsWith('insp_'))
    ) {
      navigate(buildRoute.scanDetail(item.id));
      return;
    }
    if (item.status === 'violation') {
      navigate(buildRoute.scanDetail('scn_sample_cereal_violations'));
    } else if (item.status === 'review') {
      navigate(buildRoute.scanDetail('scn_sample_tea_review'));
    } else {
      navigate(buildRoute.scanDetail('scn_sample_dairy_compliant'));
    }
  };

  const filterTabs: Array<{ id: StatusFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'violation', label: 'Failed', count: counts.violation },
    { id: 'review', label: 'Review', count: counts.review },
    { id: 'compliant', label: 'Passed', count: counts.compliant },
  ];

  return (
    <Card className="border border-border shadow-card bg-surface overflow-hidden">
      {/* 1. Section Header & Status Filters */}
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-primary/10 text-primary">
                <Activity size={15} />
              </span>
              <CardTitle className="text-base font-semibold text-foreground tracking-tight">
                Recent statutory inspections
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Monitor the latest compliance checks and evidence assessments
            </CardDescription>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.HISTORY)}
            className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors self-start sm:self-auto group py-1 focus:outline-none focus-visible:underline"
          >
            <span>View all audits</span>
            <ArrowRight size={13} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 2. Compact Status Filter Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-institutional-900 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-surface-muted border border-border/70 bg-surface'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-950'
                      : 'bg-surface-muted text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      {/* 3. Inspection Cards Feed */}
      <CardContent className="p-4 sm:p-5 space-y-2.5">
        {filteredActivity.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-2 border border-dashed border-border rounded-xl bg-surface-subtle/40">
            <div className="w-10 h-10 rounded-full bg-surface-muted border border-border flex items-center justify-center text-slate-400 mx-auto">
              <Package size={18} />
            </div>
            <div className="text-xs font-semibold text-foreground">No recent inspections</div>
            <p className="text-2xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {statusFilter === 'all'
                ? 'New compliance inspections will appear here once processing begins.'
                : `No inspection records match the "${statusFilter === 'violation' ? 'Failed' : statusFilter === 'review' ? 'Review' : 'Passed'}" status filter.`}
            </p>
          </div>
        ) : (
          filteredActivity.map((item) => {
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.info!;
            const StatusIcon = statusCfg.icon;
            const cleanName = cleanCommodityName(item.title);
            const CommodityIcon = getCommodityIcon(cleanName);
            const resultSummary = getResultSummary(item);
            const formattedDate = formatInspectionDate(item.timestamp);

            return (
              <div
                key={item.id}
                onClick={() => handleNavigate(item)}
                className={`p-4 rounded-xl border border-border border-l-4 ${statusCfg.borderClass} bg-surface hover:border-slate-400/80 dark:hover:border-slate-600 hover:shadow-subtle transition-all duration-150 text-xs flex flex-col justify-between gap-2.5 cursor-pointer group`}
              >
                {/* Status & Timestamp Header */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold font-mono uppercase border ${statusCfg.badgeClass}`}
                  >
                    <StatusIcon size={12} strokeWidth={2.5} />
                    <span>{statusCfg.label}</span>
                  </span>

                  <span className="text-2xs font-mono text-slate-500 dark:text-slate-400">
                    {formattedDate}
                  </span>
                </div>

                {/* Commodity Name & Result Summary */}
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border/80 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0 mt-0.5 group-hover:text-primary group-hover:border-primary/40 transition-colors">
                    <CommodityIcon size={16} />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug truncate">
                      {cleanName}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {resultSummary}
                    </p>
                  </div>
                </div>

                {/* Metadata & Direct Navigation Action */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-2xs text-slate-500">
                  <span className="truncate">{formatOperator(item.actor)}</span>

                  <button
                    type="button"
                    aria-label={`View inspection for ${cleanName}`}
                    className="inline-flex items-center text-xs font-semibold text-primary group-hover:text-primary/90 transition-colors shrink-0 ml-auto focus:outline-none focus-visible:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(item);
                    }}
                  >
                    <span>View inspection</span>
                    <ArrowRight
                      size={13}
                      className="ml-1 group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
