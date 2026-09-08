import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { DashboardMetrics } from '@/types/dashboard';
import { Activity, CheckCircle2, AlertOctagon, Clock } from 'lucide-react';
import { staggerContainer, staggerItem, gpuAcceleratedStyle } from '@/animations/motion';

interface ComplianceOverviewProps {
  metrics: DashboardMetrics;
}

export const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({ metrics }) => {
  const compliantCount = metrics.compliantCount ?? Math.round((metrics.totalScans * metrics.complianceRate) / 100);
  const nonCompliantCount = metrics.nonCompliantCount ?? metrics.activeViolations;
  const reviewCount = metrics.reviewRequiredCount ?? metrics.pendingReviews;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      style={gpuAcceleratedStyle}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* 1. Total Inspections */}
      <motion.div variants={staggerItem}>
        <Card interactive className="h-full hover:border-primary/50 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
                Total Inspections
              </span>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">
                <AnimatedNumber value={metrics.totalScans} />
              </div>
              <span className="text-2xs text-slate-500 font-mono">
                +<AnimatedNumber value={metrics.scansToday} duration={600} /> recorded today
              </span>
            </div>
            <div className="p-2.5 rounded bg-surface-muted text-foreground border border-border group-hover:border-primary/40 transition-colors">
              <Activity size={20} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 2. Compliant */}
      <motion.div variants={staggerItem}>
        <Card interactive className="h-full hover:border-compliant-border transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
                Compliant
              </span>
              <div className="text-2xl font-bold font-mono text-compliant mt-1">
                <AnimatedNumber value={compliantCount} />
              </div>
              <span className="text-2xs text-compliant-foreground font-mono">
                <AnimatedNumber value={metrics.complianceRate} decimals={1} suffix="%" /> compliance rate
              </span>
            </div>
            <div className="p-2.5 rounded bg-compliant-surface text-compliant border border-compliant-border">
              <CheckCircle2 size={20} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. Non-Compliant */}
      <motion.div variants={staggerItem}>
        <Card interactive className="h-full hover:border-violation-border transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
                Non-Compliant
              </span>
              <div className="text-2xl font-bold font-mono text-violation mt-1">
                <AnimatedNumber value={nonCompliantCount} />
              </div>
              <span className="text-2xs text-violation-foreground font-mono">
                Statutory infractions
              </span>
            </div>
            <div className="p-2.5 rounded bg-violation-surface text-violation border border-violation-border">
              <AlertOctagon size={20} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 4. Review Required */}
      <motion.div variants={staggerItem}>
        <Card interactive className="h-full hover:border-review-border transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-2xs uppercase tracking-wider text-slate-500 font-semibold">
                Review Required
              </span>
              <div className="text-2xl font-bold font-mono text-review mt-1">
                <AnimatedNumber value={reviewCount} />
              </div>
              <span className="text-2xs text-review-foreground font-mono">
                Pending review sign-off
              </span>
            </div>
            <div className="p-2.5 rounded bg-review-surface text-review border border-review-border">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

