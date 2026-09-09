import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ComplianceReport } from '@/types/compliance';
import { buildRoute } from '@/constants/routes';
import { FileText, Printer, FileCheck2, Search, ExternalLink, Calendar } from 'lucide-react';
import { staggerContainer, staggerItem, gpuAcceleratedStyle } from '@/animations/motion';

interface ReportListProps {
  reports: ComplianceReport[];
  onSelectReport: (report: ComplianceReport) => void;
  loading?: boolean;
}

export const ReportList: React.FC<ReportListProps> = ({ reports, onSelectReport, loading = false }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const printReport = (report: ComplianceReport) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none';
    document.body.appendChild(iframe);
    const d = iframe.contentWindow?.document;
    if (!d) { window.print(); return; }
    d.open();
    d.write(`<!DOCTYPE html><html><head><title>Report ${report.id}</title>
      <style>
        body{font-family:-apple-system,sans-serif;font-size:12px;color:#0f172a;padding:32px}
        h1{font-size:18px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
        .mono{font-family:'Courier New',monospace} .lbl{font-size:10px;color:#64748b;text-transform:uppercase;display:block;margin-bottom:2px}
        .val{font-weight:600} .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px}
        .sec{margin-top:24px} .sec-title{font-size:10px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:12px}
        .stats{display:flex;gap:16px;margin-top:12px} .stat{border:1px solid #e2e8f0;padding:8px 16px;border-radius:6px;text-align:center}
        .stat .n{font-size:20px;font-weight:700} .stat .l{font-size:9px;color:#64748b}
        .vbox{border:1px solid #fca5a5;background:#fff5f5;padding:12px;border-radius:6px;margin-bottom:8px}
        .foot{margin-top:32px;border-top:2px solid #0f172a;padding-top:16px;display:flex;justify-content:space-between;font-size:10px;color:#64748b}
        @media print{body{padding:16px}}
      </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:start;border-bottom:2px solid #0f172a;padding-bottom:16px;margin-bottom:16px">
        <div><h1>&#9679; Regulatory Compliance Report</h1><p class="mono" style="font-size:10px;color:#64748b">Legal Metrology Statutory Assessment</p></div>
        <div class="mono" style="text-align:right;font-size:10px">
          <div>REPORT: <strong>${report.id}</strong></div>
          <div>DATE: ${new Date(report.generatedAt).toLocaleString()}</div>
          <div>AUTH: ${report.generatedBy}</div>
        </div>
      </div>
      <div class="sec">
        <div class="sec-title">Statutory Inspection Finding</div>
        <div style="font-weight:700;font-size:14px;color:${report.overallStatus==='compliant'?'#16a34a':report.overallStatus==='violation'?'#dc2626':'#d97706'}">
          ${report.overallStatus==='compliant'?'COMPLIANT':report.overallStatus==='violation'?'VIOLATION':'REVIEW REQUIRED'}
        </div>
        <div class="stats">
          <div class="stat"><div class="n">${report.totalChecks}</div><div class="l">Checks</div></div>
          <div class="stat" style="border-color:#86efac"><div class="n" style="color:#16a34a">${report.passedChecks}</div><div class="l">Passed</div></div>
          <div class="stat" style="border-color:#fca5a5"><div class="n" style="color:#dc2626">${report.failedChecks}</div><div class="l">Violations</div></div>
        </div>
      </div>
      <div class="sec"><div class="sec-title">Product Particulars</div>
        <div class="grid">
          <div><span class="lbl">Product Name</span><span class="val">${report.productInfo.name}</span></div>
          <div><span class="lbl">GTIN</span><span class="val mono">${report.productInfo.gtin||'N/A'}</span></div>
          <div><span class="lbl">Manufacturer</span><span class="val">${report.productInfo.manufacturer||'N/A'}</span></div>
          <div><span class="lbl">Batch Ref</span><span class="val mono">${report.productInfo.batchNumber||'N/A'}</span></div>
        </div>
      </div>
      <div class="sec"><div class="sec-title">Executive Summary</div><p>${report.summary}</p></div>
      ${report.violations.length>0?`<div class="sec"><div class="sec-title" style="color:#dc2626">Infractions (${report.violations.length})</div>
        ${report.violations.map((v: any,i: number)=>`<div class="vbox"><strong>${v.title||v.ruleName||'Infraction '+(i+1)}</strong>
          <p style="font-size:11px">${v.description||v.message||''}</p>
          <div class="mono" style="font-size:10px">Clause: ${v.legalClause||'N/A'}</div></div>`).join('')}
      </div>`:''}
      <div class="foot">
        <div style="color:#16a34a;font-weight:600">&#10003; Authenticated &amp; Recorded</div>
        <div style="text-align:right">${report.generatedBy}<br/><span style="font-size:9px">Sig: ${report.digitalSignature?.slice(0,28)||'N/A'}...</span></div>
      </div></body></html>`);
    d.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  const safeReports = Array.isArray(reports) ? reports : [];

  const filtered = safeReports.filter((r) => {
    if (!r) return false;
    const name = r.productInfo?.name || '';
    const mfg = r.productInfo?.manufacturer || '';
    const idStr = r.id || '';
    const matchesSearch =
      !search.trim() ||
      idStr.toLowerCase().includes(search.toLowerCase()) ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      mfg.toLowerCase().includes(search.toLowerCase());
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

      {/* Reports Grid with Staggered Entrance */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-mono">
          Loading compliance inspection dossiers...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500">
          No statutory compliance reports found matching current filters.
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={gpuAcceleratedStyle}
          className="space-y-4"
        >
          {filtered.map((report) => (
            <motion.div key={report.id} variants={staggerItem}>
              <Card interactive className="border border-border hover:border-primary/80 transition-all group">
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
                    onClick={() => printReport(report)}
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
          </motion.div>
        ))}
      </motion.div>
    )}
  </div>
  );
};
