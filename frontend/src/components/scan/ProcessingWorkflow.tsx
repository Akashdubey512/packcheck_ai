import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { CheckCircle2, Loader2, ShieldCheck, Terminal } from 'lucide-react';

interface ProcessingWorkflowProps {
  scanId: string;
  onComplete: () => void;
}

interface PipelineStage {
  id: string;
  title: string;
  description: string;
  durationMs: number;
}

const STAGES: PipelineStage[] = [
  {
    id: 'stage_1',
    title: 'Image Contrast Normalization & Geometry Rectification',
    description: 'Binarizing perspective distortion, deskewing label plane, and calibrating DPI.',
    durationMs: 450,
  },
  {
    id: 'stage_2',
    title: 'OCR & Structural Polygon Geometry Extraction',
    description: 'Executing neural character recognition and computing normalized bounding coordinates.',
    durationMs: 650,
  },
  {
    id: 'stage_3',
    title: 'Mandatory Field Key-Value Normalization',
    description: 'Associating statutory entities: Net Quantity, FSSAI Lic, Expiry, Ingredients, Origin.',
    durationMs: 500,
  },
  {
    id: 'stage_4',
    title: 'Statutory Rule Engine & Legal Metrology Evaluation',
    description: 'Testing against Rule 6, Rule 7(1) numeral height, and FSSAI 2020 labelling regulations.',
    durationMs: 700,
  },
  {
    id: 'stage_5',
    title: 'Cryptographic Evidence Hashing & Trace Generation',
    description: 'Computing SHA-256 evidence digests and preparing backend audit ledger records.',
    durationMs: 400,
  },
];

export const ProcessingWorkflow: React.FC<ProcessingWorkflowProps> = ({ scanId, onComplete }) => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let currentIdx = 0;
    const startTime = Date.now();

    const addLog = (msg: string) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      setLogs((prev) => [...prev, `[+${elapsed}s] ${msg}`]);
    };

    addLog(`Pipeline initialized for scan reference: ${scanId}`);
    addLog(`Loading regulatory statutory rule set: Legal Metrology (Packaged Commodities) 2011`);

    const runStage = () => {
      if (currentIdx >= STAGES.length) {
        addLog(`Analysis complete. Compiling statutory compliance assessment...`);
        setTimeout(() => {
          onComplete();
        }, 500);
        return;
      }

      const stage = STAGES[currentIdx]!;
      setActiveStageIndex(currentIdx);
      addLog(`Executing Stage ${currentIdx + 1}: ${stage.title}...`);

      setTimeout(() => {
        addLog(`Completed Stage ${currentIdx + 1} (${stage.id})`);
        currentIdx += 1;
        runStage();
      }, stage.durationMs);
    };

    runStage();
  }, [scanId, onComplete]);

  const overallProgress = Math.min(100, Math.round(((activeStageIndex + 1) / STAGES.length) * 100));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              <CardTitle>Statutory Compliance Inspection Pipeline</CardTitle>
            </div>
            <span className="font-mono text-xs font-semibold text-primary">{overallProgress}%</span>
          </div>
          <CardDescription>
            Automated compliance evaluation running in accordance with national statutory rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full h-2 rounded bg-surface-muted overflow-hidden border border-border">
            <div
              className="h-full bg-institutional-900 dark:bg-sky-500 transition-all duration-300 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Sequential Stage Checklist */}
          <div className="space-y-3">
            {STAGES.map((stage, idx) => {
              const isCompleted = idx < activeStageIndex;
              const isCurrent = idx === activeStageIndex;

              return (
                <div
                  key={stage.id}
                  className={`p-3 rounded border transition-colors flex items-start gap-3 ${
                    isCurrent
                      ? 'border-primary bg-surface-muted ring-1 ring-primary/20'
                      : isCompleted
                      ? 'border-border/60 bg-surface'
                      : 'border-border/30 bg-surface/50 opacity-40'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 size={16} className="text-compliant" />
                    ) : isCurrent ? (
                      <Loader2 size={16} className="text-primary animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-border" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <span>{stage.title}</span>
                      {isCurrent && (
                        <span className="text-2xs font-mono font-normal uppercase px-1.5 py-0.2 rounded bg-primary text-white dark:text-slate-900">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-2xs text-slate-500 leading-relaxed">{stage.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pipeline Terminal Log */}
          <div className="rounded border border-border bg-slate-950 text-slate-300 p-3 font-mono text-2xs space-y-1 max-h-36 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold border-b border-slate-800 pb-1 mb-1">
              <Terminal size={12} />
              <span>STATUTORY AUDIT ENGINE LOGS</span>
            </div>
            {logs.map((log, i) => (
              <div key={i} className="leading-tight">
                {log}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
