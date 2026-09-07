import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DecisionTrace } from '@/types/evidence';
import { GitCommit, CheckCircle2, XCircle, ShieldCheck, Hash, X } from 'lucide-react';

interface DecisionTracePanelProps {
  trace: DecisionTrace | null;
  isLoading?: boolean;
  onClose?: () => void;
}

export const DecisionTracePanel: React.FC<DecisionTracePanelProps> = ({
  trace,
  isLoading = false,
  onClose,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6 text-center text-xs text-slate-500 border border-border">
        Loading regulatory decision trace...
      </Card>
    );
  }

  if (!trace) {
    return (
      <Card className="p-6 text-center text-xs text-slate-500 border border-border">
        Select a checklist rule or violation to inspect its deterministic decision trace.
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-surface-muted text-primary border border-border">
              <GitCommit size={16} />
            </div>
            <div>
              <CardTitle className="text-sm">Decision Trace: {trace.ruleName}</CardTitle>
              <CardDescription className="font-mono text-2xs">
                RULE_ID: {trace.ruleId} • ENGINE: {trace.executionEngineVersion}
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 text-slate-400 hover:text-foreground"
            >
              <X size={15} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 text-xs">
        {/* Compliance Assessment Verdict Header */}
        <div className="p-3 rounded bg-surface-muted border border-border flex items-center justify-between">
          <div>
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider block">
              Compliance Assessment Verdict
            </span>
            <div className="text-sm font-bold font-mono text-foreground mt-0.5">
              ASSESSMENT: {trace.outputVerdict}
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
              trace.outputVerdict === 'PASS'
                ? 'bg-compliant-surface text-compliant-foreground border border-compliant-border'
                : trace.outputVerdict === 'FAIL'
                ? 'bg-violation-surface text-violation-foreground border border-violation-border'
                : 'bg-review-surface text-review-foreground border border-review-border'
            }`}
          >
            {trace.outputVerdict}
          </span>
        </div>

        {/* Condition Evaluation Timeline */}
        <div className="space-y-2">
          <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500 block">
            Statutory Evaluated Conditions ({trace.evaluatedConditions.length})
          </span>

          <div className="space-y-2">
            {trace.evaluatedConditions.map((cond, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded border text-xs space-y-1.5 ${
                  cond.passed
                    ? 'border-border bg-surface'
                    : 'border-violation-border bg-violation-surface/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {cond.passed ? (
                      <CheckCircle2 size={15} className="text-compliant shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={15} className="text-violation shrink-0 mt-0.5" />
                    )}
                    <span className="font-medium text-foreground leading-snug">{cond.condition}</span>
                  </div>
                  <span
                    className={`text-2xs font-mono font-semibold px-1.5 py-0.2 rounded shrink-0 ${
                      cond.passed ? 'text-compliant' : 'text-violation'
                    }`}
                  >
                    {cond.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>

                <div className="pl-6 grid grid-cols-2 gap-2 text-2xs font-mono text-slate-500">
                  <div>
                    Expected: <span className="text-foreground">{String(cond.expected)}</span>
                  </div>
                  <div>
                    Actual: <span className={cond.passed ? 'text-foreground' : 'text-violation font-bold'}>{String(cond.actual)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluator Inputs Breakdown */}
        {trace.inputs && Object.keys(trace.inputs).length > 0 && (
          <div className="p-2.5 rounded bg-surface-muted border border-border space-y-1 text-2xs font-mono">
            <span className="font-semibold text-slate-500">// Evaluated Input Telemetry:</span>
            {Object.entries(trace.inputs).map(([k, v]) => (
              <div key={k} className="text-slate-600 dark:text-slate-300">
                • {k}: <span className="text-foreground font-semibold">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Backend-Supplied Audit Ledger Digest */}
        <div className="pt-2 border-t border-border/80 flex flex-col gap-1 text-2xs text-slate-500">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <ShieldCheck size={13} className="text-primary" />
            <span>Backend-Supplied Audit Ledger Digest (SHA-256)</span>
          </div>
          <div className="font-mono break-all text-slate-400 bg-surface-muted p-2 rounded border border-border/60 flex items-start gap-1">
            <Hash size={11} className="shrink-0 mt-0.5" />
            <span>SHA256:{trace.auditHash}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
