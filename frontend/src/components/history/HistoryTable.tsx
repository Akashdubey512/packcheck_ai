import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HistoryItem } from '@/types/history';
import { buildRoute } from '@/constants/routes';
import { formatGTIN } from '@/utils/formatters';
import { ArrowRight, User, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HistoryTableProps {
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

export const HistoryTable: React.FC<HistoryTableProps> = ({
  items,
  loading = false,
  onReset,
  hasActiveFilters = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="hidden md:block w-full overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-surface shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-xs text-left border-collapse">
          {/* 1. Restrained Header */}
          <thead className="bg-slate-50/90 dark:bg-slate-850/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold tracking-wider select-none sticky top-0 z-10 backdrop-blur-xs">
            <tr>
              <th scope="col" className="py-3 px-4 w-44">
                Inspection ID
              </th>
              <th scope="col" className="py-3 px-4 min-w-[180px]">
                Product
              </th>
              <th scope="col" className="py-3 px-3">
                GTIN / Barcode
              </th>
              <th scope="col" className="py-3 px-3">
                Category
              </th>
              <th scope="col" className="py-3 px-3">
                Status
              </th>
              <th scope="col" className="py-3 px-3">
                Score
              </th>
              <th scope="col" className="py-3 px-3">
                Auditor
              </th>
              <th scope="col" className="py-3 px-4">
                Date / Time
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Action
              </th>
            </tr>
          </thead>

          {/* 2. Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-surface">
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-5 w-18 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-5 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-3">
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
                    <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={9} className="py-14 text-center">
                  <div className="max-w-sm mx-auto space-y-3">
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onReset}
                        className="text-xs mt-2"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const { dateStr, timeStr } = formatInspectionDate(item.timestamp);
                const isUnknownCategory =
                  !item.category || item.category.trim().toUpperCase() === 'UNKNOWN';
                const isGtinNa =
                  !item.gtin || item.gtin.trim().toUpperCase() === 'N/A' || item.gtin.trim().toUpperCase() === 'UNKNOWN';

                // Compact semantic status badge
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

                // Compact score styling
                const score = item.complianceScore;
                const scoreClass =
                  score >= 90
                    ? 'text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-300 dark:bg-teal-950/40 dark:border-teal-800/50'
                    : score >= 60
                    ? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/50'
                    : 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-800/50';

                return (
                  <tr
                    key={item.id}
                    onClick={() => navigate(buildRoute.scanDetail(item.scanId))}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Inspection ID */}
                    <td
                      className="py-3.5 px-4 font-mono text-[11px] font-medium text-slate-600 dark:text-slate-400 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors whitespace-nowrap"
                      title={item.scanId}
                    >
                      {item.scanId}
                    </td>

                    {/* Product Name (Primary visual weight) */}
                    <td className="py-3.5 px-4 font-semibold text-[13px] text-slate-900 dark:text-slate-100 max-w-xs truncate" title={item.productName}>
                      {item.productName}
                    </td>

                    {/* GTIN / Barcode */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {isGtinNa ? (
                        <span className="text-slate-400 font-sans text-xs select-none">N/A</span>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {formatGTIN(item.gtin)}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3 text-xs whitespace-nowrap">
                      {isUnknownCategory ? (
                        <span className="text-slate-400 italic">Unknown</span>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">{statusBadge}</td>

                    {/* Score Indicator */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block font-mono text-[11px] font-semibold px-2 py-0.5 rounded border select-none ${scoreClass}`}
                      >
                        {score.toFixed(1)}%
                      </span>
                    </td>

                    {/* Auditor / Inspector */}
                    <td className="py-3.5 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-slate-400 shrink-0" aria-hidden="true" />
                        <span>{item.scannedBy}</span>
                      </div>
                    </td>

                    {/* Date / Timestamp (Two-line clean layout) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-[11px] leading-tight">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {dateStr}
                        </div>
                        {timeStr && (
                          <div className="text-slate-400 dark:text-slate-500 font-mono text-[10px] mt-0.5">
                            {timeStr}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(buildRoute.scanDetail(item.scanId));
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowRight
                          size={12}
                          className="transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
