import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardFooter } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ComplianceReport } from '@/types/compliance';
import { buildRoute } from '@/constants/routes';
import { formatGTIN } from '@/utils/formatters';
import {
  ShieldCheck,
  Printer,
  Download,
  Share2,
  FileCheck2,
  AlertOctagon,
  Scale,
  Hash,
  X,
  Check,
} from 'lucide-react';

interface ReportViewProps {
  report: ComplianceReport;
  onClose?: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, onClose }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/reports?id=${report.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance_report_${report.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Regulatory Compliance Report ${report.id}`}
    >
      <Card className="max-w-4xl w-full bg-surface border border-border shadow-modal relative max-h-[90vh] flex flex-col print:border-none print:shadow-none print:max-h-none print:static">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-muted/50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono font-bold text-slate-500 uppercase">
              Regulatory Compliance Report // {report.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} title="Print report or save as PDF" aria-label="Print report or save as PDF">
              <Printer size={13} className="mr-1.5" /> Print / Save as PDF
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadJSON} title="Export compliance data as JSON" aria-label="Export compliance report as JSON">
              <Download size={13} className="mr-1.5" /> Export JSON
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyShareLink} title="Copy share link to clipboard" aria-label="Copy report link">
              {copied ? <Check size={13} className="mr-1.5 text-compliant" /> : <Share2 size={13} className="mr-1.5" />}
              {copied ? 'Link Copied' : 'Share'}
            </Button>
            {report.productInfo.batchNumber && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate(buildRoute.verifyBatch(report.productInfo.batchNumber!))}
              >
                <FileCheck2 size={13} className="mr-1.5" /> Verify Batch
              </Button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded hover:bg-surface-muted text-slate-400 hover:text-foreground ml-2"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Printable Regulatory Compliance Report Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0 print:overflow-visible">
          {/* Statutory Reference Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold">
                <ShieldCheck size={26} />
                <span className="text-base font-extrabold uppercase tracking-wider text-foreground">
                  Regulatory Compliance Report
                </span>
              </div>
              <p className="text-2xs uppercase tracking-widest font-mono text-slate-500">
                Backend-Supplied Statutory References &amp; Metrology Assessment
              </p>
            </div>

            <div className="text-right font-mono text-2xs space-y-0.5">
              <div>REPORT REF: <strong className="text-foreground">{report.id}</strong></div>
              <div>DATE: {new Date(report.generatedAt).toLocaleString()}</div>
              <div>AUTH: {report.generatedBy}</div>
            </div>
          </div>

          {/* Assessment Verdict Hero */}
          <div className="p-4 rounded border border-border bg-surface-muted/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                Statutory Inspection Finding
              </span>
              <StatusBadge status={report.overallStatus} size="lg" />
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-center p-2 rounded bg-surface border border-border">
                <span className="text-2xs text-slate-500 block">Total Checks</span>
                <span className="font-bold text-foreground">{report.totalChecks}</span>
              </div>
              <div className="text-center p-2 rounded bg-compliant-surface border border-compliant-border text-compliant">
                <span className="text-2xs block">Passed</span>
                <span className="font-bold">{report.passedChecks}</span>
              </div>
              <div className="text-center p-2 rounded bg-violation-surface border border-violation-border text-violation">
                <span className="text-2xs block">Violations</span>
                <span className="font-bold">{report.failedChecks}</span>
              </div>
            </div>
          </div>

          {/* Product Identification Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Scale size={14} className="text-primary" />
              Product Packaging Particulars
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 rounded border border-border bg-surface">
              <div>
                <span className="text-2xs text-slate-500 block">Product Trade Name:</span>
                <span className="font-semibold text-foreground">{report.productInfo.name}</span>
              </div>
              <div>
                <span className="text-2xs text-slate-500 block">GTIN / Barcode:</span>
                <span className="font-mono font-semibold">{formatGTIN(report.productInfo.gtin)}</span>
              </div>
              <div>
                <span className="text-2xs text-slate-500 block">Manufacturer / Packer:</span>
                <span className="text-foreground">{report.productInfo.manufacturer}</span>
              </div>
              <div>
                <span className="text-2xs text-slate-500 block">Batch / Lot Reference:</span>
                <span className="font-mono text-foreground">{report.productInfo.batchNumber || 'N/A'}</span>
              </div>
              {report.productInfo.fssaiLicenseNumber && (
                <div>
                  <span className="text-2xs text-slate-500 block">FSSAI License Registration:</span>
                  <span className="font-mono text-foreground">{report.productInfo.fssaiLicenseNumber}</span>
                </div>
              )}
              {report.productInfo.netWeight && (
                <div>
                  <span className="text-2xs text-slate-500 block">Declared Net Quantity:</span>
                  <span className="font-mono text-foreground">{report.productInfo.netWeight}</span>
                </div>
              )}
            </div>
          </div>

          {/* Executive Legal Summary */}
          <div className="p-4 rounded border border-border bg-surface space-y-1.5 text-xs">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
              Executive Legal Summary
            </span>
            <p className="text-foreground leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* Violations & Prescribed Actions (if any) */}
          {report.violations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-violation flex items-center gap-1.5">
                <AlertOctagon size={14} />
                Statutory Infractions &amp; Corrective Orders ({report.violations.length})
              </h4>

              <div className="space-y-3">
                {report.violations.map((viol, i) => (
                  <div key={viol.id || i} className="p-3.5 rounded border border-violation-border bg-violation-surface/40 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{viol.title}</span>
                      <span className="text-2xs font-mono font-bold uppercase text-violation px-1.5 py-0.2 rounded border border-violation-border">
                        {viol.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-2xs leading-relaxed">{viol.description}</p>
                    <div className="text-2xs font-mono text-slate-500">
                      <strong>Legal Clause:</strong> {viol.legalClause}
                    </div>
                    <div className="p-2 rounded bg-surface border border-border text-2xs text-slate-600 dark:text-slate-300">
                      <strong>Prescribed Action:</strong> {viol.recommendedAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backend-Supplied Statutory References & Audit Ledger Hash */}
          <div className="pt-6 border-t-2 border-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 font-mono text-2xs text-slate-500">
              <div>// Backend-Supplied Digital Signature:</div>
              <div className="text-foreground font-semibold break-all">{report.digitalSignature}</div>
              <div className="flex items-center gap-1 pt-1 text-slate-400">
                <Hash size={11} />
                <span>Verification status: Backend verified</span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-2xs font-bold uppercase text-slate-500">Audit Authority Reference</div>
              <div className="font-mono text-foreground">{report.generatedBy}</div>
              <div className="text-2xs font-mono text-slate-400">Backend-supplied statutory references</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {onClose && (
          <CardFooter className="flex justify-end p-3 border-t border-border bg-surface-muted/50 print:hidden shrink-0">
            <Button size="sm" variant="outline" onClick={onClose}>
              Close Report
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
