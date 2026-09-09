import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HistoryItem } from '@/types/history';
import { buildRoute } from '@/constants/routes';
import { formatGTIN } from '@/utils/formatters';
import { ArrowRight, Calendar, User, Inbox } from 'lucide-react';

interface HistoryMobileCardsProps {
  items: HistoryItem[];
  loading?: boolean;
  onReset?: () => void;
  hasActiveFilters?: boolean;
}

function formatInspectionDate(timestampStr: string): { dateStr: string; timeStr: string } {
  try {
    const d = new Date(timestampStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return {
        dateStr: `${day} ${month} ${year}`,
        timeStr: time,
      };
    }
  } catch {
    // fallback
  }
  return { dateStr: timestampStr, timeStr: '' };
}

export const HistoryMobileCards: React.FC<HistoryMobileCardsProps> = ({
  items,
  loading = false,
  onReset,
  hasActiveFilters = false,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="md:hidden space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`mobile-skel-${i}`}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface animate-pulse space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="md:hidden py-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
          <Inbox size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No inspections found
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No inspection records match your current filters.
          </p>
        </div>
        {hasActiveFilters && onReset && (
          <Button size="sm" variant="outline" onClick={onReset} className="text-xs mt-2">
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {items.map((item) => {
        const { dateStr, timeStr } = formatInspectionDate(item.timestamp);
        const isUnknownCategory =
          !item.category || item.category.trim().toUpperCase() === 'UNKNOWN';
        const isGtinNa =
          !item.gtin || item.gtin.trim().toUpperCase() === 'N/A' || item.gtin.trim().toUpperCase() === 'UNKNOWN';

        const statusBadge =
          item.status === 'compliant' ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#047857] dark:bg-emerald-400 shrink-0" />
              Passed
            </span>
          ) : item.status === 'review' ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] dark:bg-amber-400 shrink-0" />
              Review
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C] dark:bg-rose-400 shrink-0" />
              Failed
            </span>
          );

        const score = item.complianceScore;
        const scoreClass =
          score >= 90
            ? 'text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-300 dark:bg-teal-950/40 dark:border-teal-800/50'
            : score >= 60
            ? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/50'
            : 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-800/50';

        return (
          <Card
            key={item.id}
            className="border border-slate-200 dark:border-slate-800 rounded-xl bg-surface shadow-xs overflow-hidden"
          >
            <CardHeader className="p-4 pb-2.5 space-y-2">
              <div className="flex items-center justify-between">
                {statusBadge}
                <span className="text-[11px] font-mono text-slate-400">{item.scanId}</span>
              </div>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.productName}
              </CardTitle>
            </CardHeader>

            <CardContent className="px-4 py-2 space-y-2 text-xs border-t border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex justify-between items-center py-0.5 text-[11px]">
                <span className="text-slate-500">GTIN:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {isGtinNa ? 'N/A' : formatGTIN(item.gtin)}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-[11px]">
                <span className="text-slate-500">Category:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {isUnknownCategory ? 'Unknown' : item.category}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-[11px]">
                <span className="text-slate-500">Score:</span>
                <span className={`font-mono font-semibold px-2 py-0.5 rounded border text-[11px] ${scoreClass}`}>
                  {score.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-[11px]">
                <span className="text-slate-500 flex items-center gap-1">
                  <User size={11} /> Auditor:
                </span>
                <span className="text-slate-700 dark:text-slate-300">{item.scannedBy}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-[11px]">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar size={11} /> Date:
                </span>
                <span className="text-slate-600 dark:text-slate-400 font-mono">
                  {dateStr} {timeStr}
                </span>
              </div>
            </CardContent>

            <CardFooter className="p-3 bg-slate-50/50 dark:bg-slate-850/50">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-8 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                onClick={() => navigate(buildRoute.scanDetail(item.scanId))}
              >
                Inspect result <ArrowRight size={12} className="ml-1" />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};
