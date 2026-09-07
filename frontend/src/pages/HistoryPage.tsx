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
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(() => {
        setError('Unable to load inspection history from compliance service. Please retry.');
      })
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.limit, search, status, category, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExportCSV = () => {
    const csvHeader = 'Inspection ID,Product Name,GTIN,Status,Score,Auditor,Timestamp,Category,Batch Number\n';
    const csvRows = items
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
      title="Packaging Compliance Inspection History"
      description="Historical log of inspected product packaging labels, optical telemetry records, and statutory compliance assessments."
      badge={
        <span className="text-2xs font-mono text-slate-500 bg-surface-muted px-2.5 py-1 rounded border border-border">
          Total: <strong>{total}</strong> Records
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchHistory} disabled={loading} aria-label="Refresh inspection history">
            <RefreshCw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" variant="primary" onClick={handleExportCSV} disabled={items.length === 0} aria-label="Export history to CSV">
            <Download size={13} className="mr-1.5" /> Export CSV
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* 1. Interactive Filters Toolbar */}
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
          onReset={() => {
            resetFilters();
          }}
        />

        {/* Actionable Error State */}
        {error && (
          <div className="p-6 rounded border border-violation-border bg-violation-surface text-center space-y-3">
            <AlertTriangle size={24} className="mx-auto text-violation" />
            <div className="text-xs font-semibold text-violation-foreground">{error}</div>
            <Button size="sm" variant="outline" onClick={fetchHistory}>
              Retry Connection
            </Button>
          </div>
        )}

        {!error && (
          <>
            {/* 2. Desktop Table */}
            <HistoryTable items={items} loading={loading} />

            {/* 3. Mobile Card Layout */}
            <HistoryMobileCards items={items} loading={loading} />

            {/* 4. Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-border">
              <div className="font-mono text-2xs">
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
                >
                  <ChevronLeft size={14} className="mr-1" /> Previous
                </Button>
                <span className="font-mono text-xs px-2 text-foreground font-semibold">
                  Page {pagination.page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= totalPages || loading}
                  onClick={() => setParam('page', pagination.page + 1)}
                  aria-label="Go to next page"
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
