import React from 'react';
import { Button } from '@/components/ui/Button';
import { Search, RotateCcw, Calendar, X } from 'lucide-react';

interface HistoryFiltersProps {
  search: string;
  status: string;
  category: string;
  startDate?: string;
  endDate?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onReset: () => void;
}

const CATEGORIES = [
  'Packaged Food / Cereals',
  'Dairy Products',
  'Beverages',
  'Edible Oils',
  'Infant Nutrition',
  'Packaged Snacks',
];

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  search,
  status,
  category,
  startDate = '',
  endDate = '',
  sortBy,
  sortOrder,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onStartDateChange,
  onEndDateChange,
  onSortChange,
  onReset,
}) => {
  const hasActiveFilters = Boolean(search || status || category || startDate || endDate);

  return (
    <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-card space-y-3">
      {/* Row 1: Primary Search and Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
        {/* Dominant Search Input (~35-40% on desktop) */}
        <div className="sm:col-span-2 lg:col-span-5 relative">
          <Search size={14} className="absolute left-3 top-3 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search product, GTIN, batch..."
            aria-label="Search inspection records by product name, GTIN barcode, or batch number"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 dark:focus:ring-teal-500 dark:focus:border-teal-500 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search input"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-2 relative">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by statutory compliance status"
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 text-slate-700 dark:text-slate-200 py-2 px-2.5 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 dark:focus:ring-teal-500 dark:focus:border-teal-500 transition-colors"
          >
            <option value="">All statuses</option>
            <option value="compliant">Passed</option>
            <option value="violation">Failed</option>
            <option value="review">Review</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="lg:col-span-3 relative">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by regulated commodity category"
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 text-slate-700 dark:text-slate-200 py-2 px-2.5 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 dark:focus:ring-teal-500 dark:focus:border-teal-500 transition-colors"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Control */}
        <div className="lg:col-span-2 flex items-center gap-1.5">
          <div className="relative w-full">
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                onSortChange(sb!, so as 'asc' | 'desc');
              }}
              aria-label="Sort inspection records"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 text-slate-700 dark:text-slate-200 py-2 px-2.5 focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700 dark:focus:ring-teal-500 dark:focus:border-teal-500 transition-colors"
            >
              <option value="timestamp_desc">Newest first</option>
              <option value="timestamp_asc">Oldest first</option>
              <option value="complianceScore_desc">Score: High → Low</option>
              <option value="complianceScore_asc">Score: Low → High</option>
              <option value="violationCount_desc">Infractions: Most</option>
              <option value="productName_asc">Product: A → Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Row 2: Date Range Grouped Control & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] select-none">
            <Calendar size={13} className="text-slate-400" aria-hidden="true" />
            <span>Date range:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="history-start-date" className="sr-only">
              Start Date
            </label>
            <input
              id="history-start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              aria-label="Filter records starting from date"
              className="text-[11px] rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 text-slate-700 dark:text-slate-200 py-1 px-2 focus:outline-none focus:ring-1 focus:ring-teal-700 dark:focus:ring-teal-500"
            />
            <span className="text-slate-400 text-xs select-none">→</span>
            <label htmlFor="history-end-date" className="sr-only">
              End Date
            </label>
            <input
              id="history-end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              aria-label="Filter records up to date"
              className="text-[11px] rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 text-slate-700 dark:text-slate-200 py-1 px-2 focus:outline-none focus:ring-1 focus:ring-teal-700 dark:focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Active Filter Badges & Reset Button */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 rounded-md"
              onClick={onReset}
            >
              <RotateCcw size={11} className="mr-1" /> Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
