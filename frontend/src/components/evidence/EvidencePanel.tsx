import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { OCRRegion, ExtractedField } from '@/types/scan';
import { ComplianceCheck } from '@/types/compliance';
import { ShieldCheck, Hash, Target, Percent, ExternalLink } from 'lucide-react';

interface EvidencePanelProps {
  region: OCRRegion | null;
  field: ExtractedField | null;
  check?: ComplianceCheck | null;
  onOpenDecisionTrace?: (traceId: string) => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  region,
  field,
  check,
  onOpenDecisionTrace,
}) => {
  if (!region && !field) {
    return (
      <Card className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 border border-border">
        <Target size={28} className="text-slate-400 mb-2 opacity-50" />
        <h4 className="text-xs font-semibold text-foreground">No Evidence Region Selected</h4>
        <p className="text-2xs text-slate-500 max-w-xs mt-1">
          Click any bounding box on the label image or select a checklist item to inspect extraction telemetry and statutory rule traces.
        </p>
      </Card>
    );
  }

  // Derive status
  let statusBadge: 'compliant' | 'violation' | 'review' | 'info' = 'compliant';
  if (field?.status === 'invalid' || field?.status === 'missing' || check?.status === 'violation') {
    statusBadge = 'violation';
  } else if (field?.status === 'uncertain' || check?.status === 'review') {
    statusBadge = 'review';
  }

  // Extraction confidence percentage (Strict rule: use "Extraction confidence", never "AI confidence")
  const extractionConfidence = field
    ? `${(field.confidence * 100).toFixed(1)}%`
    : region
    ? `${(region.confidence * 100).toFixed(1)}%`
    : '—';

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <CardTitle>{field?.label || 'Statutory Declaration'}</CardTitle>
          </div>
          <StatusBadge status={statusBadge} size="sm" />
        </div>
        <CardDescription>
          Optical field extraction telemetry and legal metrology verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Extracted Values Display */}
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded bg-surface-muted border border-border space-y-2">
            <div>
              <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                Raw Extracted OCR Text:
              </span>
              <div className="font-mono text-foreground font-semibold break-words">
                {field?.rawValue || region?.detectedText || '—'}
              </div>
            </div>

            {field?.normalizedValue && (
              <div className="pt-2 border-t border-border/50">
                <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Normalized Statutory Value:
                </span>
                <div className="font-mono text-foreground font-bold">
                  {field.normalizedValue}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Extraction Confidence & Coordinates Metric Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded bg-surface border border-border">
            <span className="text-2xs uppercase tracking-wider text-slate-500 block mb-0.5">
              Extraction Confidence
            </span>
            <div className="text-sm font-bold font-mono text-foreground flex items-center gap-1.5">
              <Percent size={13} className="text-primary" />
              {extractionConfidence}
            </div>
          </div>

          <div className="p-2.5 rounded bg-surface border border-border">
            <span className="text-2xs uppercase tracking-wider text-slate-500 block mb-0.5">
              Bounding Geometry
            </span>
            <div className="text-2xs font-mono text-slate-600 dark:text-slate-400">
              {region ? `X:${region.boundingBox.x.toFixed(1)}% Y:${region.boundingBox.y.toFixed(1)}%` : '—'}
            </div>
          </div>
        </div>

        {/* Associated Statutory Rule Reference */}
        {check && (
          <div className="p-3 rounded bg-surface-muted border border-border space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{check.ruleName}</span>
              <span className="text-2xs font-mono text-slate-500">{check.ruleCategory}</span>
            </div>
            <p className="text-2xs text-slate-500 font-mono">
              <Hash size={11} className="inline mr-1" />
              {check.legalReference}
            </p>
            <p className="text-2xs text-foreground leading-relaxed pt-1">
              {check.message}
            </p>

            {check.decisionTraceId && onOpenDecisionTrace && (
              <div className="pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full text-2xs"
                  onClick={() => onOpenDecisionTrace(check.decisionTraceId!)}
                >
                  <ExternalLink size={12} className="mr-1" /> View Complete Decision Trace
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
