import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { CheckCircle2, Loader2, Terminal, Cpu } from 'lucide-react';
import { butterSpring, snappySpring } from '@/animations/motion';

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
  const terminalEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll terminal logs into view smoothly
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const overallProgress = Math.min(100, Math.round(((activeStageIndex + 1) / STAGES.length) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={butterSpring}
      className="max-w-2xl mx-auto space-y-6"
    >
      <Card className="border border-border/80 shadow-2xl rounded-2xl overflow-hidden bg-surface relative glow-active">
        {/* Top High-Tech Accent Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-cyan-400 to-emerald-400" />

        <CardHeader className="pb-4 border-b border-border/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary animate-pulse">
                <Cpu size={18} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Statutory Compliance Inspection Pipeline</CardTitle>
                <CardDescription className="text-2xs">
                  Automated compliance evaluation running under Legal Metrology Rules 2011.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="font-mono text-xs font-bold text-primary">{overallProgress}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-5">
          {/* Shimmering Progress Bar */}
          <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden border border-border/70 relative">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              className="h-full bg-gradient-to-r from-primary via-sky-400 to-teal-400 rounded-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>

          {/* Sequential Stage Checklist */}
          <div className="space-y-2.5">
            {STAGES.map((stage, idx) => {
              const isCompleted = idx < activeStageIndex;
              const isCurrent = idx === activeStageIndex;

              return (
                <motion.div
                  key={stage.id}
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.01 : 1,
                  }}
                  transition={snappySpring}
                  className={`p-3 rounded-xl border transition-all duration-200 flex items-start gap-3 relative ${
                    isCurrent
                      ? 'border-primary/80 bg-surface-muted/90 ring-1 ring-primary/30 shadow-md'
                      : isCompleted
                      ? 'border-emerald-500/30 bg-surface text-slate-300'
                      : 'border-border/30 bg-surface/30 opacity-40'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={snappySpring}
                      >
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      </motion.div>
                    ) : isCurrent ? (
                      <Loader2 size={16} className="text-primary animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-border/70" />
                    )}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>{stage.title}</span>
                      {isCurrent ? (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                          Processing
                        </span>
                      ) : isCompleted ? (
                        <span className="text-[10px] font-mono text-emerald-500 font-semibold">VERIFIED</span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">QUEUED</span>
                      )}
                    </div>
                    <p className="text-2xs text-slate-400 leading-relaxed">{stage.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pipeline Terminal Log */}
          <div className="rounded-xl border border-border/80 bg-slate-950 text-slate-300 p-3.5 font-mono text-2xs space-y-1.5 max-h-40 overflow-y-auto shadow-inner">
            <div className="flex items-center justify-between text-slate-400 font-semibold border-b border-slate-800 pb-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Terminal size={12} />
                <span className="tracking-wide">TELEMETRY STREAM // KERNEL v2.4</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            {logs.map((log, i) => (
              <div key={i} className="leading-tight text-slate-300">
                <span className="text-cyan-500 mr-1.5">›</span>
                {log}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
