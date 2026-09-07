import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { ReportList, ReportView, GenerateReportModal } from '@/components/reports';
import { ReportService } from '@/services/reportService';
import { ComplianceReport } from '@/types/compliance';
import { useAuth } from '@/hooks/useAuth';
import { FilePlus, RotateCw, AlertTriangle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useAuth();
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(() => {
    setLoading(true);
    setError(null);
    ReportService.getReports()
      .then((data) => {
        setReports(data);
        // Check if query param requests a specific report (e.g. ?id=rep_2026_001)
        const targetId = searchParams.get('id');
        if (targetId) {
          const match = data.find((r) => r.id === targetId);
          if (match) setSelectedReport(match);
        }
      })
      .catch(() => {
        setError('Unable to retrieve regulatory compliance reports. Please check connectivity and retry.');
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerateReport = async (title: string, scanId: string) => {
    const created = await ReportService.generateReport(scanId, title);
    setReports((prev) => [created, ...prev]);
    setSelectedReport(created);
  };

  const handleSelectReport = (report: ComplianceReport) => {
    setSelectedReport(report);
    setSearchParams({ id: report.id });
  };

  const handleCloseReport = () => {
    setSelectedReport(null);
    setSearchParams({});
  };

  const canGenerate = role === 'LEGAL_METROLOGY_OFFICER' || role === 'ADMIN';

  return (
    <PageShell
      title="Regulatory Compliance Reports"
      description="Backend-verified compliance reports, statutory inspection assessments, and documented infractions."
      badge={
        <span className="text-2xs font-mono text-slate-500 bg-surface-muted px-2.5 py-1 rounded border border-border">
          {reports.length} Reports
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchReports} disabled={loading}>
            <RotateCw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          {canGenerate && (
            <Button size="sm" variant="primary" onClick={() => setShowGenerateModal(true)}>
              <FilePlus size={13} className="mr-1.5" /> Issue New Report
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Reports Listing or Error */}
        {error ? (
          <div className="p-12 text-center rounded border border-violation-border bg-violation-surface text-violation-foreground space-y-3">
            <AlertTriangle size={24} className="mx-auto" />
            <div className="font-semibold text-sm">{error}</div>
            <Button size="sm" variant="outline" onClick={fetchReports}>
              Retry Connection
            </Button>
          </div>
        ) : (
          <ReportList
            reports={reports}
            onSelectReport={handleSelectReport}
            loading={loading}
          />
        )}

        {/* Selected Dossier Full Modal View */}
        {selectedReport && (
          <ReportView
            report={selectedReport}
            onClose={handleCloseReport}
          />
        )}

        {/* Generate Report Modal */}
        {showGenerateModal && (
          <GenerateReportModal
            onGenerate={handleGenerateReport}
            onClose={() => setShowGenerateModal(false)}
          />
        )}
      </div>
    </PageShell>
  );
};
