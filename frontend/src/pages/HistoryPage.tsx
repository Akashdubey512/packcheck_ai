import React, { useEffect, useState, useCallback } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { HistoryFilters, HistoryTable, HistoryMobileCards } from '@/components/history';
import { useUrlState } from '@/hooks/useUrlState';
import { HistoryService } from '@/services/historyService';
import { HistoryItem } from '@/types/history';
import { ChevronLeft, ChevronRight, Download, RefreshCw, AlertTriangle } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { filters, pagination, setParam, setParams, resetFilters } = useUrlState();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read query params from URL via useUrlState
  const search = filters.search || '';
  const status = filters.status || '';
  const category = (filters as Record<string, string | undefined>).category || '';
  const startDate = (filters as Record<string, string | undefined>).startDate || '';
  const endDate = (filters as Record<string, string | undefined>).endDate || '';
  const sortBy = filters.sortBy || 'timestamp';
  const sortOrder = (filters.sortOrder || 'desc') as 'asc' | 'desc';

  const hasActiveFilters = Boolean(search || status || category || startDate || endDate);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    setError(null);
    HistoryService.getHistory({
      page: pagination.page,
      limit: pagination.limit,
      search,
      status,
      category,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    })
      .then((data) => {
        const safeItems = Array.isArray(data?.items) ? data.items : [];
        setItems(safeItems);
        setTotal(data?.total ?? safeItems.length);
        setTotalPages(data?.totalPages ?? 1);
      })
      .catch(() => {
        setItems([]);
        setError('Unable to load inspection history from compliance service. Please retry.');
      })
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.limit, search, status, category, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExportCSV = () => {
    const csvHeader = 'Inspection ID,Product Name,GTIN,Status,Score,Auditor,Timestamp,Category,Batch Number\n';
    const csvRows = (items || [])
      .map(
        (i) =>
          `"${i.scanId}","${i.productName.replace(/"/g, '""')}","${i.gtin}","${i.status}",${i.complianceScore},"${i.scannedBy}","${i.timestamp}","${i.category}","${i.batchNumber || 'N/A'}"`
      )
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `compliance_inspection_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell
      title="Packaging compliance inspection history"
      description="Historical record of packaging inspections, compliance assessments, and evidence."
      badge={
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 select-none">
          {total} records
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchHistory}
            disabled={loading}
            aria-label="Refresh inspection history"
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-medium shadow-2xs"
          >
            <RefreshCw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleExportCSV}
            disabled={(items || []).length === 0}
            aria-label="Export history to CSV"
            className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-700 dark:hover:bg-teal-600 text-xs font-medium shadow-2xs"
          >
            <Download size={13} className="mr-1.5" /> Export CSV
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* 1. Coherent Filter Panel */}
        <HistoryFilters
          search={search}
          status={status}
          category={category}
          startDate={startDate}
          endDate={endDate}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={(val) => {
            setParams({ search: val, page: 1 });
          }}
          onStatusChange={(val) => {
            setParams({ status: val, page: 1 });
          }}
          onCategoryChange={(val) => {
            setParams({ category: val, page: 1 });
          }}
          onStartDateChange={(val) => {
            setParams({ startDate: val, page: 1 });
          }}
          onEndDateChange={(val) => {
            setParams({ endDate: val, page: 1 });
          }}
          onSortChange={(newSortBy, newSortOrder) => {
            setParams({ sortBy: newSortBy, sortOrder: newSortOrder, page: 1 });
          }}
          onReset={resetFilters}
        />

        {/* Actionable Error State */}
        {error && (
          <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40 text-center space-y-3">
            <AlertTriangle size={24} className="mx-auto text-rose-600 dark:text-rose-400" />
            <div className="text-xs font-semibold text-rose-900 dark:text-rose-200">{error}</div>
            <Button size="sm" variant="outline" onClick={fetchHistory} className="text-xs">
              Retry Connection
            </Button>
          </div>
        )}

        {!error && (
          <>
            {/* 2. Desktop Audit Data Table */}
            <HistoryTable
              items={items}
              loading={loading}
              onReset={resetFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {/* 3. Mobile Card View */}
            <HistoryMobileCards
              items={items}
              loading={loading}
              onReset={resetFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {/* 4. Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 font-medium">
                Showing {items.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
                {Math.min(pagination.page * pagination.limit, total)} of {total} inspections
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => setParam('page', pagination.page - 1)}
                  aria-label="Go to previous page"
                  className="h-8 text-xs font-medium text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                >
                  <ChevronLeft size={14} className="mr-1" /> Previous
                </Button>
                <span className="text-xs px-2 text-slate-700 dark:text-slate-300 font-medium">
                  Page {pagination.page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= totalPages || loading}
                  onClick={() => setParam('page', pagination.page + 1)}
                  aria-label="Go to next page"
                  className="h-8 text-xs font-medium text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                >
                  Next <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
};
