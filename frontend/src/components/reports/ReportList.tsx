import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ComplianceReport } from '@/types/compliance';
import { buildRoute } from '@/constants/routes';
import { FileText, Printer, FileCheck2, Search, ExternalLink, Calendar } from 'lucide-react';

interface ReportListProps {
  reports: ComplianceReport[];
  onSelectReport: (report: ComplianceReport) => void;
  loading?: boolean;
}

export const ReportList: React.FC<ReportListProps> = ({ reports, onSelectReport, loading = false }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = reports.filter((r) => {
    const matchesSearch =
      !search.trim() ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.productInfo.name.toLowerCase().includes(search.toLowerCase()) ||
      r.productInfo.manufacturer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.overallStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter bar */}
      <div className="p-3 bg-surface border border-border rounded flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report ID, product, or maker..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded border border-border bg-surface-subtle text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded border border-border bg-surface-subtle text-foreground py-2 px-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Status Findings</option>
            <option value="compliant">Compliant (Passed)</option>
            <option value="violation">Violation (Notice Issued)</option>
            <option value="review">Review Required</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-mono">
          Loading compliance inspection dossiers...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500">
          No statutory compliance reports found matching current filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => (
            <Card key={report.id} className="border border-border hover:border-primary/80 transition-all">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-surface-muted text-foreground border border-border">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xs font-bold text-slate-500">{report.id}</span>
                        <StatusBadge status={report.overallStatus} size="sm" />
                      </div>
                      <CardTitle className="text-sm mt-0.5">{report.productInfo.name}</CardTitle>
                    </div>
                  </div>

                  <div className="text-2xs font-mono text-slate-400 flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(report.generatedAt).toLocaleDateString()} {new Date(report.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <CardDescription className="pt-1">
                  Authored by: <strong className="text-foreground">{report.generatedBy}</strong> • Category: {report.productInfo.category}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 pt-0 text-xs">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-2xs line-clamp-2">
                  {report.summary}
                </p>

                {report.violations.length > 0 && (
                  <div className="text-2xs text-violation font-semibold flex items-center gap-1">
                    • {report.violations.length} statutory infractions documented in this report
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 bg-surface-subtle/50 text-2xs">
                <span className="font-mono text-slate-400">
                  Signature: {report.digitalSignature ? `${report.digitalSignature.slice(0, 24)}...` : 'N/A'}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-2xs h-7"
                    onClick={() => onSelectReport(report)}
                  >
                    <ExternalLink size={11} className="mr-1" /> View Report
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-2xs h-7"
                    onClick={() => onSelectReport(report)}
                  >
                    <Printer size={11} className="mr-1" /> Print
                  </Button>
                  {report.productInfo.batchNumber && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-2xs h-7 text-primary"
                      onClick={() => navigate(buildRoute.verifyBatch(report.productInfo.batchNumber!))}
                    >
                      <FileCheck2 size={11} className="mr-1" /> Verify Batch
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
