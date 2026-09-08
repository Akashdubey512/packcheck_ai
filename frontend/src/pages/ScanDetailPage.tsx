import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { EvidenceViewer } from '@/components/evidence/EvidenceViewer';
import { EvidencePanel } from '@/components/evidence/EvidencePanel';
import { ComplianceAssessment } from '@/components/compliance/ComplianceAssessment';
import { DecisionTracePanel } from '@/components/compliance/DecisionTracePanel';
import { ScanService } from '@/services/scanService';
import { ComplianceService, ComplianceCheckResult } from '@/services/complianceService';
import { Scan, BoundingBox } from '@/types/scan';
import { ComplianceCheck } from '@/types/compliance';
import { DecisionTrace } from '@/types/evidence';
import { ROUTES } from '@/constants/routes';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, FileText, Target, ShieldCheck, GitCommit } from 'lucide-react';
import { butterSpring, pageFadeSlide, gpuAcceleratedStyle } from '@/animations/motion';

export const ScanDetailPage: React.FC = () => {
  const { id = 'scn_sample_cereal' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [scan, setScan] = useState<Scan | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Evidence interactive selection state
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [focusedBoundingBox, setFocusedBoundingBox] = useState<BoundingBox | null>(null);
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);

  // Active Decision Trace state
  const [activeTrace, setActiveTrace] = useState<DecisionTrace | null>(null);
  const [isTraceLoading, setIsTraceLoading] = useState(false);

  // Tab state for right-side workspace: 'assessment' | 'evidence' | 'trace'
  const [activeTab, setActiveTab] = useState<'assessment' | 'evidence' | 'trace'>('assessment');
  const [error, setError] = useState<string | null>(null);

  // Load Scan and Compliance data
  const loadScanData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([ScanService.getScan(id), ComplianceService.getComplianceCheck(id)])
      .then(([scanData, compData]) => {
        setScan(scanData);
        setComplianceResult(compData);

        // If violations exist, pre-select the first critical infraction
        if (compData.violations.length > 0) {
          const firstViol = compData.violations[0]!;
          if (firstViol.boundingBox) {
            setFocusedBoundingBox(firstViol.boundingBox);
            const matchingRegion = scanData.ocrRegions.find(
              (r) =>
                Math.abs(r.boundingBox.x - firstViol.boundingBox!.x) < 2 &&
                Math.abs(r.boundingBox.y - firstViol.boundingBox!.y) < 2
            );
            if (matchingRegion) {
              setSelectedRegionId(matchingRegion.id);
            }
          }
        }
      })
      .catch(() => {
        setError(`Unable to retrieve packaging inspection record for "${id}".`);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    loadScanData();
  }, [loadScanData]);

  // Central interaction: Focusing on a bounding box from check or violation
  const handleFocusRegion = useCallback(
    (box?: BoundingBox, fieldRef?: string) => {
      if (!box || !scan) return;

      // 1. Set focused coordinates for EvidenceViewer camera
      setFocusedBoundingBox(box);

      // 2. Find matching OCR region
      const matchingRegion = scan.ocrRegions.find(
        (r) =>
          Math.abs(r.boundingBox.x - box.x) < 2 && Math.abs(r.boundingBox.y - box.y) < 2
      );
      if (matchingRegion) {
        setSelectedRegionId(matchingRegion.id);
      }

      // 3. Find matching check
      if (complianceResult) {
        const matchingCheck = complianceResult.checks.find(
          (c) => c.fieldReference === fieldRef || c.ruleId === fieldRef
        );
        if (matchingCheck) {
          setSelectedCheckId(matchingCheck.id);
        }
      }
    },
    [scan, complianceResult]
  );

  // Direct selection from clicking a Checklist Item
  const handleSelectCheck = useCallback(
    (check: ComplianceCheck) => {
      setSelectedCheckId(check.id);

      if (!scan) return;

      // Find matching extracted field
      const field = scan.extractedFields.find((f) => f.fieldName === check.fieldReference);
      if (field?.sourceLocation) {
        setFocusedBoundingBox(field.sourceLocation);
        if (field.ocrRegionId) {
          setSelectedRegionId(field.ocrRegionId);
        }
      } else if (check.fieldReference) {
        const region = scan.ocrRegions.find((r) => r.id.includes(check.fieldReference!));
        if (region) {
          setFocusedBoundingBox(region.boundingBox);
          setSelectedRegionId(region.id);
        }
      }

      // If check has a trace, prepare it
      if (check.decisionTraceId) {
        handleViewTrace(check.decisionTraceId);
      }
    },
    [scan]
  );

  // Selection from clicking directly on a bounding box in the EvidenceViewer
  const handleSelectRegionFromViewer = useCallback(
    (regionId: string) => {
      setSelectedRegionId(regionId);
      if (!scan) return;

      const region = scan.ocrRegions.find((r) => r.id === regionId);
      if (region) {
        setFocusedBoundingBox(region.boundingBox);
      }

      // Find matching check and select it
      const field = scan.extractedFields.find((f) => f.ocrRegionId === regionId);
      if (field && complianceResult) {
        const check = complianceResult.checks.find((c) => c.fieldReference === field.fieldName);
        if (check) {
          setSelectedCheckId(check.id);
        }
      }

      // Switch to evidence panel tab
      setActiveTab('evidence');
    },
    [scan, complianceResult]
  );

  // Load and display Decision Trace
  const handleViewTrace = (traceId: string) => {
    setIsTraceLoading(true);
    setActiveTab('trace');
    ComplianceService.getDecisionTrace(traceId)
      .then((trace) => setActiveTrace(trace))
      .finally(() => setIsTraceLoading(false));
  };

  // Selected entities for the EvidencePanel
  const currentRegion = scan?.ocrRegions.find((r) => r.id === selectedRegionId) || null;
  const currentField =
    scan?.extractedFields.find((f) => f.ocrRegionId === selectedRegionId) ||
    scan?.extractedFields.find((f) => f.fieldName === complianceResult?.checks.find((c) => c.id === selectedCheckId)?.fieldReference) ||
    null;
  const currentCheck =
    complianceResult?.checks.find((c) => c.id === selectedCheckId) ||
    complianceResult?.checks.find((c) => c.fieldReference === currentField?.fieldName) ||
    null;

  return (
    <PageShell
      title={scan?.product?.name || `Statutory Audit Inspection: ${id}`}
      description={`GTIN: ${scan?.product?.gtin || '—'} • Manufacturer: ${scan?.product?.manufacturer || '—'} • Lot: ${scan?.product?.batchNumber || 'N/A'}`}
      badge={
        complianceResult ? (
          <StatusBadge status={complianceResult.overallStatus} size="sm" />
        ) : null
      }
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.SCAN)}>
            <RotateCcw size={13} className="mr-1" /> Re-scan
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.HISTORY)}>
            <ArrowLeft size={13} className="mr-1" /> Audit History
          </Button>
          <Button size="sm" variant="primary" onClick={() => navigate(ROUTES.REPORTS)}>
            <FileText size={13} className="mr-1" /> Export Audit Dossier
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-500 font-mono">
          Loading statutory inspection records and optical bounding coordinates...
        </div>
      ) : scan && complianceResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Evidence Viewer with Interactive Pan/Zoom & Overlays */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Statutory Evidence Viewport
                </h3>
              </div>
              <span className="text-2xs font-mono text-slate-500">
                {scan.ocrRegions.length} Optical Bounding Polygons
              </span>
            </div>

            <EvidenceViewer
              imageUrl={scan.fileUrl}
              fileName={scan.fileName}
              regions={scan.ocrRegions}
              extractedFields={scan.extractedFields}
              selectedRegionId={selectedRegionId}
              onSelectRegion={handleSelectRegionFromViewer}
              focusedBoundingBox={focusedBoundingBox}
            />

            {/* Quick Helper Tips */}
            <div className="p-3 rounded bg-surface-muted border border-border text-2xs text-slate-500 flex items-center justify-between">
              <span>
                💡 <strong>Audit Tip:</strong> Click any violation card or checklist rule to smoothly pan and zoom directly into the label evidence.
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-2xs h-6 text-primary"
                onClick={() => {
                  if (scan.ocrRegions[0]) {
                    handleSelectRegionFromViewer(scan.ocrRegions[0].id);
                  }
                }}
              >
                Reset Focus
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: Tabbed Compliance Assessment, Evidence Panel & Decision Trace */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-4">
            {/* Workspace Navigation Tabs with Liquid Sliding Spring Indicator */}
            <div className="relative flex items-center gap-1 p-1 rounded bg-surface-muted border border-border">
              <button
                type="button"
                onClick={() => setActiveTab('assessment')}
                className="relative flex-1 py-1.5 px-3 text-xs font-semibold rounded flex items-center justify-center gap-1.5 z-10 transition-colors"
              >
                {activeTab === 'assessment' && (
                  <motion.span
                    layoutId="activeScanTabPill"
                    transition={butterSpring}
                    className="absolute inset-0 bg-surface rounded shadow-subtle border border-border/50 -z-10"
                  />
                )}
                <ShieldCheck size={14} className={activeTab === 'assessment' ? 'text-primary' : 'text-slate-400'} />
                <span className={activeTab === 'assessment' ? 'text-foreground' : 'text-slate-600 dark:text-slate-400'}>
                  Compliance ({complianceResult.checks.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('evidence')}
                className="relative flex-1 py-1.5 px-3 text-xs font-semibold rounded flex items-center justify-center gap-1.5 z-10 transition-colors"
              >
                {activeTab === 'evidence' && (
                  <motion.span
                    layoutId="activeScanTabPill"
                    transition={butterSpring}
                    className="absolute inset-0 bg-surface rounded shadow-subtle border border-border/50 -z-10"
                  />
                )}
                <Target size={14} className={activeTab === 'evidence' ? 'text-primary' : 'text-slate-400'} />
                <span className={activeTab === 'evidence' ? 'text-foreground' : 'text-slate-600 dark:text-slate-400'}>
                  Evidence Telemetry
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('trace')}
                className="relative flex-1 py-1.5 px-3 text-xs font-semibold rounded flex items-center justify-center gap-1.5 z-10 transition-colors"
              >
                {activeTab === 'trace' && (
                  <motion.span
                    layoutId="activeScanTabPill"
                    transition={butterSpring}
                    className="absolute inset-0 bg-surface rounded shadow-subtle border border-border/50 -z-10"
                  />
                )}
                <GitCommit size={14} className={activeTab === 'trace' ? 'text-primary' : 'text-slate-400'} />
                <span className={activeTab === 'trace' ? 'text-foreground' : 'text-slate-600 dark:text-slate-400'}>
                  Decision Trace
                </span>
              </button>
            </div>

            {/* AnimatePresence for Butter-Smooth Tab Switching */}
            <AnimatePresence mode="wait">
              {/* Tab 1: Compliance Assessment (Violations & Checklist) */}
              {activeTab === 'assessment' && (
                <motion.div
                  key="assessment"
                  variants={pageFadeSlide}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={gpuAcceleratedStyle}
                >
                  <ComplianceAssessment
                    overallStatus={complianceResult.overallStatus}
                    score={complianceResult.score}
                    checks={complianceResult.checks}
                    violations={complianceResult.violations}
                    selectedCheckId={selectedCheckId}
                    onSelectCheck={handleSelectCheck}
                    onFocusRegion={handleFocusRegion}
                    onViewTrace={handleViewTrace}
                  />
                </motion.div>
              )}

              {/* Tab 2: Evidence Panel (Telemetry & Extracted Confidence) */}
              {activeTab === 'evidence' && (
                <motion.div
                  key="evidence"
                  variants={pageFadeSlide}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={gpuAcceleratedStyle}
                >
                  <EvidencePanel
                    region={currentRegion}
                    field={currentField}
                    check={currentCheck}
                    onOpenDecisionTrace={handleViewTrace}
                  />
                </motion.div>
              )}

              {/* Tab 3: Decision Trace Panel (Conditions & Cryptographic Ledger Proof) */}
              {activeTab === 'trace' && (
                <motion.div
                  key="trace"
                  variants={pageFadeSlide}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={gpuAcceleratedStyle}
                >
                  <DecisionTracePanel
                    trace={activeTrace}
                    isLoading={isTraceLoading}
                    onClose={() => setActiveTab('assessment')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded border border-violation-border bg-violation-surface text-violation-foreground space-y-4 max-w-lg mx-auto">
          <div className="font-semibold text-sm">
            {error || 'Statutory inspection record could not be retrieved.'}
          </div>
          <p className="text-2xs text-slate-600 dark:text-slate-300">
            The requested inspection record may not exist or the compliance service connection timed out.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button size="sm" variant="outline" onClick={loadScanData}>
              Retry Inspection
            </Button>
            <Button size="sm" variant="primary" onClick={() => navigate(ROUTES.SCAN)}>
              Return to Ingestion
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
};
