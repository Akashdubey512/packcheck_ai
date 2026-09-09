import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { CategoryMetric } from '@/types/dashboard';
import { PieChart } from 'lucide-react';
import { butterSpring, staggerContainer, staggerItem, gpuAcceleratedStyle } from '@/animations/motion';

interface ViolationDistributionProps {
  categories: CategoryMetric[];
}

export const ViolationDistribution: React.FC<ViolationDistributionProps> = ({ categories = [] }) => {
  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <Card className="border border-border shadow-card bg-surface overflow-hidden">
      {/* 1. Header with Restrained Enterprise Typography */}
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <PieChart size={15} />
            </span>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-foreground tracking-tight">
                Category compliance
              </CardTitle>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                Statutory groups
              </span>
            </div>
          </div>
        </div>

        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Pass ratios across statutory food and commodity groups
        </CardDescription>
      </CardHeader>

      {/* 2. Category Compliance Breakdown */}
      <CardContent className="p-4 sm:p-5">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={gpuAcceleratedStyle}
          className="space-y-4"
        >
          {safeCategories.map((cat) => {
            // Semantic color rule:
            // High compliance (>=90%) uses primary enterprise teal (#0F766E).
            // Moderate warning (75%-89%) uses muted amber.
            // Critical violations (<75%) uses muted red.
            const barFillClass =
              cat.rate >= 90
                ? 'bg-teal-700 dark:bg-teal-600'
                : cat.rate >= 75
                ? 'bg-amber-600 dark:bg-amber-500'
                : 'bg-rose-600 dark:bg-rose-500';

            return (
              <motion.div
                key={cat.category}
                variants={staggerItem}
                className="space-y-1.5 group"
              >
                {/* Line 1: Category Name & Pass Metric */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                    {cat.category}
                  </span>
                  <div className="flex items-baseline gap-1 select-none">
                    <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                      {cat.rate}%
                    </span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Pass
                    </span>
                  </div>
                </div>

                {/* Line 2: Supporting Counts (Compliant · Violations) */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span>
                      {cat.compliant.toLocaleString()} / {cat.total.toLocaleString()} compliant
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    {cat.violations > 0 ? (
                      <span className="text-rose-600/90 dark:text-rose-400/90 font-normal">
                        {cat.violations.toLocaleString()} violations
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 font-normal">
                        0 violations
                      </span>
                    )}
                  </div>
                </div>

                {/* Line 3: Cohesive Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.max(cat.rate, 0), 100)}%` }}
                    transition={butterSpring}
                    className={`h-full rounded-full ${barFillClass} transition-all duration-300`}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </CardContent>
    </Card>
  );
};
