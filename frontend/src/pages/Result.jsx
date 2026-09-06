import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  ScanLine,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  FileImage,
  Calendar,
  Hash,
  Scale,
  Download,
  AlertCircle,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Alert from "../components/ui/Alert.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import Badge from "../components/ui/Badge.jsx";
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
import {
  DECLARATION_KEYS,
  DECLARATION_METADATA,
  formatConfidence,
} from "../utils/declarations.js";
import { getScan, downloadScanReport } from "../api/scans.js";

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
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return isoString;
  }
}

function resolveImageUrl(url) {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const base = import.meta.env.VITE_API_BASE_URL || "";
  const hostRoot = base.replace(/\/api\/?$/, "");
  return `${hostRoot}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function Result() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Instant render from navigation state if available and matching :id
  const [scan, setScan] = useState(() => {
    if (location.state?.scan && location.state.scan.scanId === id) {
      return location.state.scan;
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    return !(location.state?.scan && location.state.scan.scanId === id);
  });

  const [error, setError] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // Fetch scan by ID if direct navigation or refresh
  useEffect(() => {
    if (!id) return;
    if (scan && scan.scanId === id) {
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getScan(id)
      .then((data) => {
        if (isMounted) {
          setScan(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to retrieve scan assessment:", err);
          if (err.response?.status === 404) {
            setError("Scan Record Not Found");
          } else {
            setError(
              err.response?.data?.error ||
                "Unable to retrieve scan assessment. Please verify your connection or try again."
            );
          }
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDownloadReport = async () => {
    if (!scan?.scanId || downloadingReport) return;
    setDownloadingReport(true);
    setReportError(null);
    try {
      const blob = await downloadScanReport(scan.scanId);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `NIRIKSHAN-Scan-${scan.scanId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Report download failed:", err);
      setReportError("The inspection report is currently unavailable for download.");
    } finally {
      setDownloadingReport(false);
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Compliance Assessment"
          subtitle={`Loading scan reference ${id || "..."}`}
          category="LEGAL METROLOGY INSPECTION"
          className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 mb-6"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-4 w-2/3 mb-6" />
              <TableSkeleton rows={8} cols={4} />
            </Card>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // 404 / ERROR STATE
  if (error || !scan) {
    const is404 = error === "Scan Record Not Found";
    return (
      <div className="space-y-6">
        <PageHeader
          title="Compliance Assessment"
          subtitle={`Reference: ${id || "Unknown"}`}
          category="LEGAL METROLOGY INSPECTION"
          actions={
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate("/")}
              icon={ScanLine}
            >
              New Scan
            </Button>
          }
          className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 mb-6"
        />

        <div className="max-w-2xl mx-auto py-8">
          <EmptyState
            title={is404 ? "Scan Record Not Found" : "Assessment Unavailable"}
            description={
              is404
                ? `No scan record exists for ID "${id}". It may have expired or the identifier is invalid.`
                : error || "An unexpected error occurred while loading this scan."
            }
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate("/")}
                icon={ScanLine}
              >
                Initiate New Scan
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  // CONTRACT-SAFE COMPUTED VALUES
  const isCompliant = scan.overallStatus === "COMPLIANT";
  const declarations = scan.declarations || {};
  const violations = Array.isArray(scan.violations) ? scan.violations : [];

  const foundCount = DECLARATION_KEYS.filter(
    (k) => Boolean(declarations[k]?.found)
  ).length;

  const totalKeys = DECLARATION_KEYS.length;
  const resolvedImageUrl = resolveImageUrl(scan.imageUrl);

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="Compliance Assessment"
        subtitle={`Scan Reference: ${scan.scanId} · Recorded: ${formatDateTime(scan.createdAt)}`}
        category="LEGAL METROLOGY INSPECTION"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate("/")}
              icon={ScanLine}
            >
              New Scan
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleDownloadReport}
              loading={downloadingReport}
              icon={FileText}
            >
              Download Report
            </Button>
          </div>
        }
        className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 mb-6"
      />

      {/* Report Download Notice / Error if any */}
      {reportError && (
        <Alert type="warning" title="Report Notice" className="shadow-xs">
          {reportError}
        </Alert>
      )}

      {/* 2. TWO-COLUMN WORKSTATION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* PRIMARY COLUMN: Assessment, Findings, Declaration Checklist */}
        <div className="lg:col-span-8 space-y-6">
          {/* 3. OVERALL ASSESSMENT BANNER (Primary Visual Priority) */}
          <div
            className={`rounded-md border p-5 shadow-subtle ${
              isCompliant
                ? "bg-emerald-50/50 border-emerald-300 text-emerald-950"
                : "bg-rose-50/50 border-rose-300 text-rose-950"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                    isCompliant
                      ? "bg-emerald-600 text-white"
                      : "bg-rose-600 text-white"
                  }`}
                >
                  {isCompliant ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertOctagon className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base font-bold tracking-tight text-slate-900">
                      Assessment Result
                    </h2>
                    <StatusBadge
                      status={scan.overallStatus}
                      size="md"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    {isCompliant
                      ? "All applicable declarations detected on the commodity label passed statutory verification checks."
                      : "Statutory non-compliances were identified. Inspect the compliance findings and checklist below for missing or non-conforming label declarations."}
                  </p>
                </div>
              </div>

              {/* Assessment Metrics Chips */}
              <div className="flex sm:flex-col items-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-3 sm:pt-0 sm:pl-5">
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                    Declarations
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                    {foundCount} / {totalKeys} Detected
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                    Findings
                  </span>
                  <span
                    className={`text-xs font-mono font-bold tabular-nums ${
                      violations.length > 0
                        ? "text-rose-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {violations.length} Violation{violations.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. COMPLIANCE FINDINGS (Violations) */}
          {violations.length > 0 ? (
            <Card className="border border-rose-200 shadow-card overflow-hidden">
              <CardHeader className="bg-rose-50/60 border-b border-rose-100 py-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      Compliance Findings
                    </CardTitle>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
                    {violations.length} {violations.length === 1 ? "Finding" : "Findings"} Identified
                  </span>
                </div>
              </CardHeader>
              <CardBody className="p-4 bg-white">
                <ul className="space-y-2">
                  {violations.map((violation, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-rose-950 bg-rose-50/40 p-2.5 rounded border border-rose-100"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span className="font-medium leading-relaxed">{violation}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : (
            <div className="p-4 bg-white border border-slate-200 rounded-md shadow-subtle flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-slate-700 font-medium">
                No compliance findings were returned for this assessment.
              </p>
            </div>
          )}

          {/* 5. DECLARATION CHECKLIST TABLE */}
          <Card className="border border-slate-200 shadow-card">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-700" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Declaration Checklist
                  </CardTitle>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {totalKeys} Statutory Items Checked
                </span>
              </div>
            </CardHeader>

            <CardBody className="p-0">
              <Table>
                <TableHead>
                  <TableRow hover={false}>
                    <TableHeaderCell className="w-2/5">
                      Declaration & Rule
                    </TableHeaderCell>
                    <TableHeaderCell className="w-28 text-center">
                      Status
                    </TableHeaderCell>
                    <TableHeaderCell>
                      Extracted Evidence
                    </TableHeaderCell>
                    <TableHeaderCell className="w-24 text-right">
                      Confidence
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {DECLARATION_KEYS.map((key) => {
                    const meta = DECLARATION_METADATA[key] || {
                      label: key,
                      ruleRef: "Statutory Rule",
                      isRequired: true,
                    };
                    const item = declarations[key] || {
                      found: false,
                      value: null,
                      confidence: 0,
                    };

                    const isFound = Boolean(item.found);

                    return (
                      <TableRow key={key} hover={true}>
                        {/* 1. Declaration & Rule Ref */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900 text-xs">
                                {meta.label}
                              </span>
                              {!meta.isRequired && (
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                                  Conditional
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-slate-500">
                              {meta.ruleRef}
                            </p>
                          </div>
                        </TableCell>

                        {/* 2. Status Badge */}
                        <TableCell className="text-center whitespace-nowrap">
                          <StatusBadge
                            status={isFound ? "FOUND" : "MISSING"}
                            size="sm"
                          />
                        </TableCell>

                        {/* 3. Extracted Evidence */}
                        <TableCell>
                          {isFound && item.value ? (
                            <span className="font-mono text-xs text-slate-900 break-words whitespace-pre-wrap leading-relaxed block max-w-md">
                              {item.value}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-sm">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* 4. Confidence */}
                        <TableCell className="text-right" tabular={true}>
                          <span
                            className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${
                              isFound
                                ? "bg-slate-100 text-slate-800 border-slate-200"
                                : "bg-slate-50 text-slate-400 border-slate-200/60"
                            }`}
                          >
                            {formatConfidence(item.confidence)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>

        {/* SECONDARY COLUMN: Label Evidence, Metadata, Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* 6. LABEL EVIDENCE CARD */}
          <Card className="border border-slate-200 shadow-card overflow-hidden">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-slate-700" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Label Evidence
                </CardTitle>
              </div>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              <div className="relative w-full rounded border border-slate-200 bg-slate-950/5 overflow-hidden flex items-center justify-center min-h-[220px] max-h-[380px]">
                {resolvedImageUrl && !imageLoadFailed ? (
                  <img
                    src={resolvedImageUrl}
                    alt={`Packaged commodity label evidence for scan ${scan.scanId}`}
                    onError={() => setImageLoadFailed(true)}
                    className="max-h-[380px] w-auto max-w-full object-contain mx-auto"
                  />
                ) : (
                  <div className="p-6 text-center space-y-2 text-slate-400">
                    <FileImage className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-mono">
                      Evidence image preview unavailable
                    </p>
                    {scan.imageUrl && (
                      <p className="text-[10px] font-mono text-slate-400 truncate max-w-xs">
                        {scan.imageUrl}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 font-sans leading-tight">
                Original image evidence captured and archived for this inspection record.
              </p>
            </CardBody>
          </Card>

          {/* 7. INSPECTION METADATA CARD */}
          <Card className="border border-slate-200 shadow-card">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-700" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Inspection Metadata
                </CardTitle>
              </div>
            </CardHeader>
            <CardBody className="p-4 space-y-3 text-xs">
              <div className="space-y-1 pb-2 border-b border-slate-100">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  Scan Identifier
                </span>
                <span className="font-mono text-xs font-semibold text-slate-900 select-all break-all block">
                  {scan.scanId}
                </span>
              </div>

              <div className="space-y-1 pb-2 border-b border-slate-100">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  Recorded Timestamp
                </span>
                <span className="font-mono text-xs text-slate-800 block">
                  {formatDateTime(scan.createdAt)}
                </span>
              </div>

              <div className="space-y-1 pb-2 border-b border-slate-100">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  Statutory Scope
                </span>
                <span className="text-slate-800 font-medium block">
                  Legal Metrology (Packaged Commodities) Rules, 2011
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  Assessment Status
                </span>
                <StatusBadge status={scan.overallStatus} size="sm" />
              </div>
            </CardBody>
          </Card>

          {/* 8. QUICK ACTIONS CARD */}
          <Card className="border border-slate-200 shadow-card">
            <CardBody className="p-4 space-y-2.5">
              <Button
                variant="primary"
                size="md"
                onClick={handleDownloadReport}
                loading={downloadingReport}
                icon={FileText}
                className="w-full justify-center text-xs uppercase tracking-wider font-semibold"
              >
                Download PDF Report
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => navigate("/")}
                icon={ScanLine}
                className="w-full justify-center text-xs uppercase tracking-wider font-semibold"
              >
                Initiate New Scan
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
