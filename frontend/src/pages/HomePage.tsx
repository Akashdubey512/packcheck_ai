import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ROUTES } from '@/constants/routes';
import { PRESET_LABEL_SAMPLES } from '@/utils/sampleLabels';
import {
  ScanLine,
  LayoutDashboard,
  History,
  FileCheck2,
  ShieldCheck,
  ArrowRight,
  Layers,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartPresetScan = (sampleId: string) => {
    navigate(`${ROUTES.SCAN}?preset=${sampleId}`);
  };

  return (
    <PageShell
      title="Verify Packaged Commodity Compliance"
      description="Scan package labels, extract declarations, assess requirements, inspect evidence, and generate verification-ready reports."
      badge={<StatusBadge status="compliant" customText="Auditor Gateway Operational" size="sm" />}
    >
      <div className="space-y-8">
        {/* Institutional Hero Action Banner */}
        <div className="p-6 sm:p-8 rounded border border-border bg-surface shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Statutory Inspection Gateway
              </span>
              <span className="text-2xs text-slate-400 font-mono">v2.4.1 REG-ENGINE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Automated Label Inspection &amp; Statutory Assessment
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload consumer product packaging artwork or photograph. The optical rule engine extracts declarations, validates metric numeral heights under Legal Metrology Rules, cross-references FSSAI licensing, and outputs digitally verifiable decision traces.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <Button
              size="lg"
              variant="primary"
              className="w-full sm:w-auto"
              onClick={() => navigate(ROUTES.SCAN)}
            >
              <ScanLine size={16} className="mr-2" /> Start Compliance Scan
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate(ROUTES.VERIFY)}
            >
              <FileCheck2 size={16} className="mr-2" /> Verify a Report
            </Button>
          </div>
        </div>

        {/* 1-Click Interactive Test Samples Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Demonstration Inspection Datasets (DEMO)
              </h3>
            </div>
            <span className="text-2xs text-slate-500 font-mono">Select to test inspection workflow immediately</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRESET_LABEL_SAMPLES.map((sample) => {
              const statusBadgeMap = {
                violation: 'violation' as const,
                compliant: 'compliant' as const,
                review: 'review' as const,
              }[sample.status];

              return (
                <Card key={sample.id} className="flex flex-col justify-between hover:border-primary transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={statusBadgeMap} size="sm" />
                      <span className="text-2xs font-mono text-slate-400">{sample.category}</span>
                    </div>
                    <CardTitle className="text-sm mt-2">{sample.name}</CardTitle>
                    <CardDescription className="line-clamp-2 leading-relaxed mt-1">
                      {sample.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs font-semibold"
                      onClick={() => handleStartPresetScan(sample.id)}
                    >
                      Audit This Sample <ArrowRight size={13} className="ml-1.5" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Primary Operational Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded bg-surface-muted text-foreground">
                  <LayoutDashboard size={18} />
                </div>
                <span className="text-2xs font-mono text-slate-500">MOD-01</span>
              </div>
              <CardTitle className="mt-2">Dashboard</CardTitle>
              <CardDescription>Aggregate compliance health, inspection volume, and statutory alerts.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(ROUTES.DASHBOARD)}>
                Open Dashboard
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded bg-surface-muted text-foreground">
                  <ScanLine size={18} />
                </div>
                <span className="text-2xs font-mono text-slate-500">MOD-02</span>
              </div>
              <CardTitle className="mt-2">Scan &amp; Ingest</CardTitle>
              <CardDescription>Upload label artifacts for OCR extraction and rule engine evaluation.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(ROUTES.SCAN)}>
                New Scan
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded bg-surface-muted text-foreground">
                  <History size={18} />
                </div>
                <span className="text-2xs font-mono text-slate-500">MOD-03</span>
              </div>
              <CardTitle className="mt-2">Audit History</CardTitle>
              <CardDescription>Historical regulatory inspections with synchronized URL filters.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(ROUTES.HISTORY)}>
                View History
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-2 rounded bg-surface-muted text-foreground">
                  <FileCheck2 size={18} />
                </div>
                <span className="text-2xs font-mono text-slate-500">MOD-04</span>
              </div>
              <CardTitle className="mt-2">Batch Verification</CardTitle>
              <CardDescription>Cryptographic proof validation against immutable registers.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(ROUTES.VERIFY)}>
                Verify Batch
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Statutory Legal Disclaimer */}
        <div className="p-4 rounded border border-border bg-surface-muted/50 text-2xs text-slate-500 flex items-start gap-3">
          <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Statutory Notice: All optical measurements, font size detections, and rule evaluations are processed deterministically against regulatory benchmarks. Records generated under this gateway form part of verification-ready compliance audit dossiers.
          </p>
        </div>
      </div>
    </PageShell>
  );
};
