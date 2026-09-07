import React from 'react';
import { Button } from '@/components/ui/Button';
import { Search, Filter, RotateCcw, ArrowUpDown, Calendar } from 'lucide-react';

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
  return (
    <div className="p-3.5 bg-surface border border-border rounded shadow-card space-y-3">
      {/* Primary Filter Controls Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search Bar */}
        <div className="sm:col-span-4 relative">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search product, GTIN, batch..."
            aria-label="Search inspection records by product name, GTIN barcode, or batch number"
            className="w-full pl-9 pr-3 py-2 text-xs rounded border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Dropdown */}
        <div className="sm:col-span-3 flex items-center gap-1.5">
          <Filter size={13} className="text-slate-400 shrink-0" aria-hidden="true" />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by statutory compliance status"
            className="w-full text-xs rounded border border-border bg-surface-subtle text-foreground py-2 px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Status Assessments</option>
            <option value="compliant">Compliant (Passed)</option>
            <option value="violation">Violation (Failed)</option>
            <option value="review">Review Required</option>
          </select>
        </div>

        {/* Category Dropdown */}
        <div className="sm:col-span-3">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by regulated commodity category"
            className="w-full text-xs rounded border border-border bg-surface-subtle text-foreground py-2 px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Regulatory Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div className="sm:col-span-2 flex items-center gap-1.5">
          <ArrowUpDown size={13} className="text-slate-400 shrink-0" aria-hidden="true" />
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('_');
              onSortChange(sb!, so as 'asc' | 'desc');
            }}
            aria-label="Sort inspection records"
            className="w-full text-xs rounded border border-border bg-surface-subtle text-foreground py-2 px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="timestamp_desc">Newest First</option>
            <option value="timestamp_asc">Oldest First</option>
            <option value="complianceScore_desc">Score: High → Low</option>
            <option value="complianceScore_asc">Score: Low → High</option>
            <option value="violationCount_desc">Infractions: Most</option>
            <option value="productName_asc">Product Name: A → Z</option>
          </select>
        </div>
      </div>

      {/* Date Range Filtering Row */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-2xs">
          <Calendar size={13} aria-hidden="true" />
          <span>Date Range:</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="history-start-date" className="sr-only">Start Date</label>
          <input
            id="history-start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            aria-label="Filter records starting from date"
            className="text-2xs rounded border border-border bg-surface-subtle text-foreground py-1 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-2xs text-slate-400">to</span>
          <label htmlFor="history-end-date" className="sr-only">End Date</label>
          <input
            id="history-end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            aria-label="Filter records up to date"
            className="text-2xs rounded border border-border bg-surface-subtle text-foreground py-1 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Active Filter Badges & Reset Button */}
      {(search || status || category || startDate || endDate) && (
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-2xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-500">
            <span>Active Filters:</span>
            {search && (
              <span className="px-2 py-0.5 rounded bg-surface-muted border border-border text-foreground font-mono">
                Query: "{search}"
              </span>
            )}
            {status && (
              <span className="px-2 py-0.5 rounded bg-surface-muted border border-border text-foreground font-mono">
                Status: {status}
              </span>
            )}
            {category && (
              <span className="px-2 py-0.5 rounded bg-surface-muted border border-border text-foreground font-mono">
                Category: {category}
              </span>
            )}
            {startDate && (
              <span className="px-2 py-0.5 rounded bg-surface-muted border border-border text-foreground font-mono">
                From: {startDate}
              </span>
            )}
            {endDate && (
              <span className="px-2 py-0.5 rounded bg-surface-muted border border-border text-foreground font-mono">
                To: {endDate}
              </span>
            )}
          </div>

          <Button type="button" size="sm" variant="ghost" className="h-6 text-2xs" onClick={onReset}>
            <RotateCcw size={11} className="mr-1" /> Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
};
