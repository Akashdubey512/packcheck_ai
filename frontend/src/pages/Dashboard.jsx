import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  ScanLine,
  ChevronRight,
  RefreshCw,
  ChevronLeft,
  BarChart3,
  CheckCircle2,
  XCircle,
  Hash,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
} from "../components/ui/Card.jsx";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "../components/ui/Table.jsx";
import { TableSkeleton, Skeleton } from "../components/ui/LoadingState.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Select from "../components/ui/Select.jsx";
import { getDashboardStats, listScans } from "../api/scans.js";

// ─────────────────────────────────────────────────────────
// Utility: format ISO timestamp to readable locale string
// ─────────────────────────────────────────────────────────
function formatDateTime(isoString) {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return isoString;
  }
}

// ─────────────────────────────────────────────────────────
// Utility: truncate scanId for compact display
// ─────────────────────────────────────────────────────────
function truncateScanId(id) {
  if (!id) return "—";
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id;
}

// ─────────────────────────────────────────────────────────
// Stat Card — drives the four-metric summary strip
// ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, loading, accentClass = "" }) {
  return (
    <Card className="border border-slate-200 shadow-card">
      <CardBody className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-500 mb-2">
              {label}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p
                className={`text-3xl font-bold tabular-nums tracking-tight ${
                  accentClass || "text-slate-900"
                }`}
              >
                {value ?? "—"}
              </p>
            )}
            {sub && !loading && (
              <p className="text-xs text-slate-500 mt-1 font-mono">{sub}</p>
            )}
          </div>
          {Icon && (
            <div className="w-9 h-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-slate-500" />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Scan row — shared between Recent Scans and History table
// ─────────────────────────────────────────────────────────
function ScanTableRow({ scan, onView }) {
  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => onView(scan.scanId)}
    >
      <TableCell>
        <span
          className="font-mono text-xs text-slate-700 select-all"
          title={scan.scanId}
        >
          {truncateScanId(scan.scanId)}
        </span>
      </TableCell>
      <TableCell>
        <StatusBadge status={scan.overallStatus} size="sm" />
      </TableCell>
      <TableCell tabular={true}>
        <span className="text-xs text-slate-700 font-mono">
          {formatDateTime(scan.createdAt)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(scan.scanId);
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded"
          aria-label={`View assessment for scan ${scan.scanId}`}
        >
          View Assessment
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </TableCell>
    </TableRow>
  );
}

// ─────────────────────────────────────────────────────────
// Shared table header
// ─────────────────────────────────────────────────────────
function ScanTableHead() {
  return (
    <TableHead>
      <TableRow hover={false}>
        <TableHeaderCell>Scan ID</TableHeaderCell>
        <TableHeaderCell>Assessment Status</TableHeaderCell>
        <TableHeaderCell>Date / Time</TableHeaderCell>
        <TableHeaderCell className="text-right">Action</TableHeaderCell>
      </TableRow>
    </TableHead>
  );
}

// ─────────────────────────────────────────────────────────
// DASHBOARD VIEW — stats + recent scans
// ─────────────────────────────────────────────────────────
function DashboardView() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const fetchStats = useCallback(() => {
    setLoadingStats(true);
    setStatsError(null);
    getDashboardStats()
      .then((data) => {
        setStats(data);
        setLoadingStats(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard stats:", err);
        setStatsError(
          err.response?.data?.error ||
            "Unable to load compliance statistics. Please verify your connection or try again."
        );
        setLoadingStats(false);
      });
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleView = (scanId) => {
    navigate(`/scan/${scanId}`);
  };

  const compliantPercent =
    stats?.compliantPercent != null
      ? `${Number(stats.compliantPercent).toFixed(1)}%`
      : null;

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────── */}
      <PageHeader
        title="Dashboard"
        subtitle="Compliance activity and inspection overview."
        category="LEGAL METROLOGY INSPECTION"
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={ScanLine}
            onClick={() => navigate("/")}
          >
            New Scan
          </Button>
        }
      />

      {/* ── Body ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 space-y-8 pb-10">
        {/* Stats error */}
        {statsError && (
          <Alert type="error" title="Statistics Unavailable">
            {statsError}
            <div className="mt-2">
              <button
                onClick={fetchStats}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 underline-offset-2 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          </Alert>
        )}

        {/* ── Four summary cards ──────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Scans"
            value={stats?.totalScans}
            icon={Hash}
            loading={loadingStats && !statsError}
          />
          <StatCard
            label="Compliant"
            value={stats?.compliantCount}
            icon={CheckCircle2}
            loading={loadingStats && !statsError}
            accentClass="text-emerald-700"
          />
          <StatCard
            label="Non-Compliant"
            value={stats?.nonCompliantCount}
            icon={XCircle}
            loading={loadingStats && !statsError}
            accentClass="text-rose-700"
          />
          <StatCard
            label="Compliance Rate"
            value={compliantPercent}
            icon={BarChart3}
            loading={loadingStats && !statsError}
            sub={
              stats?.totalScans
                ? `${stats.compliantCount} of ${stats.totalScans} inspections`
                : undefined
            }
            accentClass={
              stats?.compliantPercent >= 50 ? "text-emerald-700" : "text-rose-700"
            }
          />
        </div>

        {/* ── Recent Scans ────────────────────────────── */}
        <div className="space-y-4">
          <SectionHeader
            title="Recent Inspections"
            subtitle="Most recently submitted packaged commodity scans."
            actions={
              <Button
                variant="ghost"
                size="sm"
                icon={History}
                onClick={() => navigate("/dashboard?tab=history")}
              >
                Full History
              </Button>
            }
          />

          {loadingStats && !statsError ? (
            <div className="border border-slate-200 rounded-md bg-white p-5 shadow-card">
              <TableSkeleton rows={4} cols={4} />
            </div>
          ) : statsError ? (
            <EmptyState
              title="Recent inspections unavailable"
              description="Statistics could not be retrieved. Retry above to reload."
              icon={History}
            />
          ) : !stats?.recentScans?.length ? (
            <EmptyState
              title="No inspections recorded yet"
              description="Submit your first packaged commodity label image to begin."
              icon={ScanLine}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={ScanLine}
                  onClick={() => navigate("/")}
                >
                  New Scan
                </Button>
              }
            />
          ) : (
            <Table>
              <ScanTableHead />
              <TableBody>
                {stats.recentScans.map((scan) => (
                  <ScanTableRow
                    key={scan.scanId}
                    scan={scan}
                    onView={handleView}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// HISTORY VIEW — full paginated scan list with status filter
// ─────────────────────────────────────────────────────────
const HISTORY_LIMIT = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "COMPLIANT", label: "Compliant" },
  { value: "NON_COMPLIANT", label: "Non-Compliant" },
];

function HistoryView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive controlled state from URL query params
  const statusParam = searchParams.get("status") || "";
  const rawPage = parseInt(searchParams.get("page"), 10);
  const pageParam = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [data, setData] = useState(null); // { total, page, limit, scans }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(
    (status, page) => {
      setLoading(true);
      setError(null);

      const params = { page, limit: HISTORY_LIMIT };
      if (status) params.status = status;

      listScans(params)
        .then((responseData) => {
          setData(responseData);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load scan history:", err);
          setError(
            err.response?.data?.error ||
              "Unable to retrieve scan history. Please verify your connection or try again."
          );
          setLoading(false);
        });
    },
    []
  );

  // Fetch whenever status or page changes
  useEffect(() => {
    fetchHistory(statusParam, pageParam);
  }, [statusParam, pageParam, fetchHistory]);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    // Reset to page 1 on filter change
    const next = new URLSearchParams(searchParams);
    next.set("tab", "history");
    if (newStatus) {
      next.set("status", newStatus);
    } else {
      next.delete("status");
    }
    next.set("page", "1");
    setSearchParams(next, { replace: true });
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "history");
    next.set("page", String(newPage));
    setSearchParams(next, { replace: true });
  };

  const handleView = (scanId) => {
    navigate(`/scan/${scanId}`);
  };

  const handleRetry = () => {
    fetchHistory(statusParam, pageParam);
  };

  const totalPages =
    data?.total && data?.limit
      ? Math.ceil(data.total / data.limit)
      : 1;

  const currentPage = data?.page ?? pageParam;
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;
  const totalRecords = data?.total ?? 0;

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────── */}
      <PageHeader
        title="Scan History"
        subtitle="Review previously submitted packaged commodity inspections."
        category="LEGAL METROLOGY INSPECTION"
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={ScanLine}
            onClick={() => navigate("/")}
          >
            New Scan
          </Button>
        }
      />

      {/* ── Body ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 space-y-6 pb-10">

        {/* ── Filter bar ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Filter by Status
            </p>
            <Select
              id="history-status-filter"
              value={statusParam}
              onChange={handleStatusChange}
              options={STATUS_OPTIONS}
              className="min-w-[180px]"
            />
          </div>

          {!loading && data && (
            <p className="text-xs text-slate-500 font-mono shrink-0">
              {totalRecords === 0
                ? "No records"
                : `${totalRecords} record${totalRecords !== 1 ? "s" : ""} · Page ${currentPage} of ${totalPages}`}
            </p>
          )}
        </div>

        {/* ── Error ───────────────────────────────────── */}
        {error && (
          <Alert type="error" title="History Unavailable">
            {error}
            <div className="mt-2">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 underline-offset-2 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          </Alert>
        )}

        {/* ── Table / Loading / Empty ──────────────────── */}
        {loading ? (
          <div className="border border-slate-200 rounded-md bg-white p-5 shadow-card">
            <TableSkeleton rows={8} cols={4} />
          </div>
        ) : error ? null : !data?.scans?.length ? (
          <EmptyState
            title={
              statusParam
                ? `No ${statusParam.replace("_", "-").toLowerCase()} inspections found`
                : "No inspections recorded yet"
            }
            description={
              statusParam
                ? "Try changing the status filter or clear it to view all records."
                : "Submit your first packaged commodity label image to begin."
            }
            icon={History}
            action={
              !statusParam ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={ScanLine}
                  onClick={() => navigate("/")}
                >
                  New Scan
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const next = new URLSearchParams();
                    next.set("tab", "history");
                    setSearchParams(next, { replace: true });
                  }}
                >
                  Clear Filter
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <ScanTableHead />
            <TableBody>
              {data.scans.map((scan) => (
                <ScanTableRow
                  key={scan.scanId}
                  scan={scan}
                  onView={handleView}
                />
              ))}
            </TableBody>
          </Table>
        )}

        {/* ── Pagination ──────────────────────────────── */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={isFirstPage}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>

            <span className="text-xs font-mono text-slate-600 tabular-nums">
              Page {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={isLastPage}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Root export — dispatches between Dashboard and History
// based on ?tab=history in the URL
// ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");

  if (tab === "history") {
    return <HistoryView />;
  }
  return <DashboardView />;
}
