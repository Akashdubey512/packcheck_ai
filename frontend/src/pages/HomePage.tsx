import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ROUTES, buildRoute } from '@/constants/routes';
import { PRESET_LABEL_SAMPLES } from '@/utils/sampleLabels';
import {
  ScanLine,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Scale,
  Cpu,
  Layers,
  LayoutDashboard,
} from 'lucide-react';
import {
  butterSpring,
  staggerContainer,
  staggerItem,
  gpuAcceleratedStyle,
} from '@/animations/motion';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

type DemoTabKey = 'cereal' | 'dairy' | 'tea';

interface DemoCaseData {
  id: DemoTabKey;
  scanId: string;
  name: string;
  category: string;
  status: 'violation' | 'compliant' | 'review';
  score: number;
  sampleIndex: number;
  badgeLabel: string;
  findings: Array<{
    type: 'pass' | 'fail' | 'warn';
    rule: string;
    text: string;
  }>;
  boxes: Array<{
    top: string;
    left: string;
    width: string;
    height: string;
    label: string;
    status: 'pass' | 'fail' | 'warn';
  }>;
}

const DEMO_CASES: Record<DemoTabKey, DemoCaseData> = {
  cereal: {
    id: 'cereal',
    scanId: 'scn_sample_cereal_violations',
    name: 'Apex Fortified Cereal',
    category: 'Breakfast Cereals',
    status: 'violation',
    score: 67,
    sampleIndex: 0,
    badgeLabel: '3 Violations',
    findings: [
      { type: 'fail', rule: 'PCR 2011 Rule 5', text: 'Numeral height 1.8mm < 4.0mm statutory min' },
      { type: 'fail', rule: 'FSSAI Reg 2.2', text: 'Missing mandatory Best Before / Expiry imprint' },
      { type: 'pass', rule: 'FSSAI Veg Emblem', text: 'Vegetarian green emblem verified' },
      { type: 'pass', rule: 'PCR 2011 Rule 6', text: 'Manufacturer & customer care valid' },
    ],
    boxes: [
      { top: '65%', left: '7%', width: '42%', height: '11%', label: 'Net Wt: 1.8mm [FAIL]', status: 'fail' },
      { top: '75%', left: '50%', width: '42%', height: '12%', label: 'Expiry: [MISSING]', status: 'fail' },
      { top: '4%', left: '83%', width: '12%', height: '10%', label: 'Veg Logo [PASS]', status: 'pass' },
      { top: '65%', left: '50%', width: '42%', height: '10%', label: 'FSSAI Lic [PASS]', status: 'pass' },
    ],
  },
  dairy: {
    id: 'dairy',
    scanId: 'scn_sample_dairy_compliant',
    name: 'Apex Fresh Milk 1L',
    category: 'Dairy Products',
    status: 'compliant',
    score: 100,
    sampleIndex: 1,
    badgeLabel: '100% Compliant',
    findings: [
      { type: 'pass', rule: 'PCR 2011 Rule 5', text: 'Numeral height 4.8mm exceeds 4.0mm threshold' },
      { type: 'pass', rule: 'FSSAI Central Lic', text: 'Central License #10012011000999 active' },
      { type: 'pass', rule: 'PCR Rule 6(1)(e)', text: 'MRP inclusive of all taxes valid' },
      { type: 'pass', rule: 'GS1 GTIN-13', text: 'Barcode 8901030999011 verified' },
    ],
    boxes: [
      { top: '48%', left: '8%', width: '84%', height: '10%', label: 'Volume: 1000ml (4.8mm) [PASS]', status: 'pass' },
      { top: '53%', left: '8%', width: '84%', height: '9%', label: 'FSSAI Central Lic [PASS]', status: 'pass' },
      { top: '61%', left: '8%', width: '84%', height: '9%', label: 'Use By Date [PASS]', status: 'pass' },
      { top: '67%', left: '8%', width: '84%', height: '9%', label: 'MRP Display [PASS]', status: 'pass' },
    ],
  },
  tea: {
    id: 'tea',
    scanId: 'scn_sample_tea_review',
    name: 'Botanical Green Tea',
    category: 'Herbal Beverages',
    status: 'review',
    score: 88,
    sampleIndex: 2,
    badgeLabel: 'Review Required',
    findings: [
      { type: 'warn', rule: 'FSSAI Date Norms', text: 'Date phrasing requires batch correlation' },
      { type: 'pass', rule: 'PCR 2011 Rule 5', text: 'Net Weight numeral 3.2mm meets threshold' },
      { type: 'pass', rule: 'State Metrology', text: 'State registration & helpline verified' },
    ],
    boxes: [
      { top: '68%', left: '50%', width: '42%', height: '12%', label: 'Date Phrasing [REVIEW]', status: 'warn' },
      { top: '65%', left: '7%', width: '42%', height: '11%', label: 'Net Weight: 100g [PASS]', status: 'pass' },
      { top: '5%', left: '83%', width: '12%', height: '10%', label: 'Veg Logo [PASS]', status: 'pass' },
    ],
  },
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeDemo, setActiveDemo] = useState<DemoTabKey>('cereal');
  const [hoveredBox, setHoveredBox] = useState<string | null>(null);

  const currentCase = DEMO_CASES[activeDemo];
  const sampleImageUri = PRESET_LABEL_SAMPLES[currentCase.sampleIndex]?.imageUrl ?? '';

  return (
    <div className="w-full min-h-screen bg-background relative overflow-hidden flex flex-col justify-between p-4 sm:p-8 lg:p-12 tech-grid-pattern">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={gpuAcceleratedStyle}
        className="max-w-6xl mx-auto w-full space-y-8"
      >
        {/* 1. CINEMATIC MINIMAL HERO */}
        <motion.div variants={staggerItem} className="text-center space-y-4 pt-2">
          {/* Punchy Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight">
            Automated Label Compliance.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-400 to-teal-300">
              Deterministic &amp; Fast.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-medium">
            Instant optical font height calibration, Legal Metrology Rule 5 verification, and tamper-proof batch records.
          </p>

          {/* Dual Main CTAs */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <Button
              size="lg"
              variant="primary"
              className="font-semibold shadow-lg shadow-primary/20 text-xs sm:text-sm px-6 h-10 group"
              onClick={() => navigate(ROUTES.SCAN)}
            >
              <ScanLine size={16} className="mr-2 group-hover:rotate-45 transition-transform" />
              Launch Live Scanner
              <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="font-medium text-xs sm:text-sm px-6 h-10 border-border hover:bg-surface-muted/60"
              onClick={() => navigate(ROUTES.DASHBOARD)}
            >
              <LayoutDashboard size={15} className="mr-2 text-primary" />
              Open Dashboard
            </Button>
          </div>
        </motion.div>

        {/* 2. PROMINENT INTERACTIVE LIVE SCANNER HUD (CENTERPIECE) */}
        <motion.div variants={staggerItem}>
          <Card className="border border-border/80 shadow-2xl overflow-hidden bg-surface rounded-2xl glow-active">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
              {/* Left Viewport: Label & 120 FPS Laser Beam */}
              <div className="lg:col-span-7 bg-surface-subtle p-5 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between relative overflow-hidden">
                {/* HUD Header */}
                <div className="flex items-center justify-between text-2xs font-mono pb-2 border-b border-border/60 z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-foreground font-bold">OPTICAL SENSOR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-0.5 bg-cyan-400 rounded-full h-full animate-wave-1" />
                      <span className="w-0.5 bg-cyan-400 rounded-full h-full animate-wave-2" />
                      <span className="w-0.5 bg-cyan-400 rounded-full h-full animate-wave-3" />
                      <span className="w-0.5 bg-cyan-400 rounded-full h-full animate-wave-4" />
                    </div>
                    <span className="text-slate-500">300 DPI CALIBRATED</span>
                  </div>
                </div>

                {/* Central Simulated Canvas with Laser Sweep */}
                <div className="my-auto py-2 flex justify-center items-center relative">
                  <div className="relative w-full max-w-[320px] aspect-[4/5] rounded-xl overflow-hidden border border-border shadow-lg bg-white">
                    <img
                      src={sampleImageUri}
                      alt={currentCase.name}
                      className="w-full h-full object-cover select-none pointer-events-none"
                    />

                    {/* 120 FPS Laser Sweep Beam */}
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_14px_rgba(56,189,248,1)] animate-laser pointer-events-none z-20" />

                    {/* Reticle Corners */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none z-10" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none z-10" />
                    <div className="absolute bottom-2 left-2 w-4 h-2 border-b-2 border-l-2 border-cyan-400 pointer-events-none z-10" />
                    <div className="absolute bottom-2 right-2 w-4 h-2 border-b-2 border-r-2 border-cyan-400 pointer-events-none z-10" />

                    {/* Dynamic Bounding Boxes */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentCase.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        {currentCase.boxes.map((box, idx) => {
                          const isHovered = hoveredBox === box.label;
                          const borderColor =
                            box.status === 'pass'
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                              : box.status === 'fail'
                              ? 'border-rose-500 bg-rose-500/20 text-rose-400'
                              : 'border-amber-500 bg-amber-500/20 text-amber-400';

                          return (
                            <motion.div
                              key={idx}
                              whileHover={{ scale: 1.02 }}
                              onMouseEnter={() => setHoveredBox(box.label)}
                              onMouseLeave={() => setHoveredBox(null)}
                              style={{
                                top: box.top,
                                left: box.left,
                                width: box.width,
                                height: box.height,
                              }}
                              className={`absolute border-2 rounded cursor-pointer transition-all duration-200 z-30 flex items-start p-0.5 ${borderColor} ${
                                isHovered ? 'ring-2 ring-white shadow-md' : ''
                              }`}
                            >
                              <span className="text-[8px] font-mono font-bold uppercase px-1 rounded bg-slate-950/80 text-white truncate">
                                {box.label}
                              </span>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="text-center text-2xs font-mono text-slate-500 pt-2 border-t border-border/60">
                  REAL-TIME BOUNDING BOX SIMULATOR
                </div>
              </div>

              {/* Right Viewport: Telemetry, Presets & Findings */}
              <div className="lg:col-span-5 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Preset Selector Tabs */}
                  <div className="flex items-center p-1 bg-surface-muted rounded-lg border border-border">
                    {(Object.keys(DEMO_CASES) as DemoTabKey[]).map((tabKey) => {
                      const item = DEMO_CASES[tabKey];
                      const isSelected = activeDemo === tabKey;
                      return (
                        <button
                          key={tabKey}
                          type="button"
                          onClick={() => setActiveDemo(tabKey)}
                          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all relative ${
                            isSelected
                              ? 'text-foreground font-semibold shadow-xs'
                              : 'text-slate-400 hover:text-foreground'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="activeHeroTabPill"
                              transition={butterSpring}
                              className="absolute inset-0 bg-surface rounded-md border border-border shadow-xs"
                            />
                          )}
                          <span className="relative z-10 flex items-center justify-center gap-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === 'compliant'
                                  ? 'bg-emerald-500'
                                  : item.status === 'violation'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            {item.name.split(' ')[1] || item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Header Status Row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{currentCase.name}</h3>
                      <span className="text-2xs font-mono text-slate-500">{currentCase.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={currentCase.status} size="sm" />
                      <span
                        className={`font-mono text-2xs font-bold px-2 py-0.5 rounded border ${
                          currentCase.status === 'compliant'
                            ? 'bg-compliant-surface text-compliant border-compliant-border'
                            : currentCase.status === 'violation'
                            ? 'bg-violation-surface text-violation border-violation-border'
                            : 'bg-review-surface text-review border-review-border'
                        }`}
                      >
                        {currentCase.score}%
                      </span>
                    </div>
                  </div>

                  {/* 3 KPI Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-surface-muted border border-border group hover:border-primary/40 transition-colors">
                      <div className="text-[10px] text-slate-500 font-mono">Accuracy</div>
                      <div className="text-xs font-bold font-mono text-foreground">
                        <AnimatedNumber value={99.8} decimals={1} suffix="%" />
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-muted border border-border group hover:border-primary/40 transition-colors">
                      <div className="text-[10px] text-slate-500 font-mono">Speed</div>
                      <div className="text-xs font-bold font-mono text-foreground">
                        <AnimatedNumber value={0.82} decimals={2} suffix="s" />
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-surface-muted border border-border group hover:border-primary/40 transition-colors">
                      <div className="text-[10px] text-slate-500 font-mono">Logic</div>
                      <div className="text-xs font-bold font-mono text-primary">100% Rule</div>
                    </div>
                  </div>

                  {/* Findings Checklist */}
                  <div className="space-y-1.5">
                    {currentCase.findings.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded border border-border/80 bg-surface-muted/40 text-2xs flex items-center gap-2"
                      >
                        {item.type === 'fail' ? (
                          <AlertOctagon size={12} className="text-rose-500 shrink-0" />
                        ) : item.type === 'warn' ? (
                          <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                        ) : (
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        )}
                        <span className="font-mono font-bold text-foreground shrink-0">{item.rule}:</span>
                        <span className="text-slate-400 truncate">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Action */}
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full text-xs font-semibold"
                  onClick={() => navigate(buildRoute.scanDetail(currentCase.scanId))}
                >
                  Audit This Sample Dossier <ArrowRight size={13} className="ml-1.5" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 3. THREE VISUAL BENEFIT CARDS (MINIMAL TEXT, MAXIMUM IMPACT) */}
        <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border bg-surface flex items-center gap-3.5 shadow-xs hover:border-primary/50 transition-colors">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Scale size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Sub-Millimeter Font Sizing</div>
              <div className="text-2xs text-slate-400">Rule 5 optical numeral height calibration.</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface flex items-center gap-3.5 shadow-xs hover:border-primary/50 transition-colors">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Cpu size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">Deterministic Decision Trees</div>
              <div className="text-2xs text-slate-400">Grounded legal logic with zero hallucinations.</div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-surface flex items-center gap-3.5 shadow-xs hover:border-primary/50 transition-colors">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">SHA-256 Batch Verification</div>
              <div className="text-2xs text-slate-400">Cryptographically signed inspection dossiers.</div>
            </div>
          </div>
        </motion.div>

        {/* 4. QUICK 1-CLICK LAUNCH BENCHMARK SAMPLES */}
        <motion.div variants={staggerItem} className="space-y-3">
          <div className="flex items-center justify-between text-2xs font-mono text-slate-400">
            <span className="flex items-center gap-1 font-semibold uppercase text-foreground">
              <Layers size={13} className="text-primary" /> Instant Benchmark Scenarios
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESET_LABEL_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => navigate(`${ROUTES.SCAN}?preset=${sample.id}`)}
                className="p-3.5 rounded-xl border border-border bg-surface hover:border-primary/70 hover:bg-surface-muted/50 transition-all text-left flex items-center justify-between group shadow-xs"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {sample.name}
                  </div>
                  <div className="text-2xs font-mono text-slate-400">{sample.category}</div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={sample.status} size="sm" />
                  <ArrowRight size={13} className="text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
