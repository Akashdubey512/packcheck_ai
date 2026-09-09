import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { TimelineMetric } from '@/types/dashboard';
import { TrendingUp, Calendar } from 'lucide-react';
import { staggerContainer, staggerItem, gpuAcceleratedStyle } from '@/animations/motion';

interface ComplianceTrendProps {
  timeline: TimelineMetric[];
}

function formatDateLabel(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parts[2];
      const monthNum = parseInt(parts[1]!, 10) - 1;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[monthNum] || 'Sep'}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' });
      return `${day} ${month}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

function formatFullDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const day = parts[2];
      const monthNum = parseInt(parts[1]!, 10) - 1;
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return `${day} ${months[monthNum] || 'September'} ${year}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export const ComplianceTrend: React.FC<ComplianceTrendProps> = ({ timeline = [] }) => {
  const [hoveredDay, setHoveredDay] = useState<TimelineMetric | null>(null);

  const safeTimeline = Array.isArray(timeline) ? timeline : [];
  const maxDaily = Math.max(...safeTimeline.map((d) => d.total), 280);

  return (
    <Card className="border border-border shadow-card bg-surface overflow-hidden">
      {/* 1. Header with Restrained Typography & Subtle Legend */}
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/80 space-y-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <TrendingUp size={15} />
            </span>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-foreground tracking-tight">
                Compliance inspection trends
              </CardTitle>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                Last 7 days
              </span>
            </div>
          </div>

          {/* Calm, Muted Legend with 6px Dots */}
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 select-none">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-700 dark:bg-teal-500 inline-block" />
              <span>Compliant</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-500 inline-block" />
              <span>Violations</span>
            </span>
          </div>
        </div>

        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Daily inspection throughput and statutory infraction distribution
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* 2. Dynamic Tooltip / Contextual Helper */}
        <div className="min-h-[34px] flex items-center">
          <AnimatePresence mode="wait">
            {hoveredDay ? (
              <motion.div
                key={hoveredDay.date}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                  <Calendar size={12} className="text-slate-400" />
                  <span>{formatFullDate(hoveredDay.date)}</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    Total: <strong className="font-semibold text-slate-900 dark:text-white">{hoveredDay.total}</strong>
                  </span>
                  <span className="text-teal-700 dark:text-teal-400 font-medium">
                    {hoveredDay.compliant} Compliant
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    {hoveredDay.violations} Violations
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    ({((hoveredDay.compliant / (hoveredDay.total || 1)) * 100).toFixed(1)}% pass)
                  </span>
                </div>
              </motion.div>
            ) : (
              <div className="w-full flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 px-1">
                <span>Hover a day for details</span>
                <span className="text-[11px] font-mono text-slate-400">7-day throughput</span>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Stacked Bar Chart with Restrained Enterprise Palette */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={gpuAcceleratedStyle}
          className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-44 pt-2 pb-1"
        >
          {safeTimeline.map((day) => {
            const totalPct = Math.min(Math.round((day.total / maxDaily) * 100), 100);
            const violationPct = day.total > 0 ? (day.violations / day.total) * 100 : 0;
            const compliantPct = 100 - violationPct;
            const dateLabel = formatDateLabel(day.date);
            const isHovered = hoveredDay?.date === day.date;

            return (
              <motion.div
                key={day.date}
                variants={staggerItem}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                className="flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
              >
                {/* Total Count Header: Clean, 12px, Slate Gray */}
                <div
                  className={`text-xs font-medium transition-colors ${
                    isHovered ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {day.total}
                </div>

                {/* Bar Container: 8px Radius, Soft Slate Background, Subtle Border */}
                <div
                  className={`w-full max-w-[36px] h-32 rounded-lg bg-slate-100 dark:bg-slate-800/80 border flex flex-col justify-end overflow-hidden transition-all duration-150 relative ${
                    isHovered
                      ? 'border-slate-400 dark:border-slate-500 ring-2 ring-slate-400/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700/70'
                  }`}
                >
                  {/* Dynamic Stacked Column */}
                  <div
                    style={{ height: `${totalPct}%` }}
                    className="w-full flex flex-col justify-end overflow-hidden rounded-md transition-all duration-300"
                  >
                    {/* Top: Compliant portion (Sophisticated Teal #0F766E) */}
                    <div
                      style={{ height: `${compliantPct}%` }}
                      className="w-full bg-teal-700 dark:bg-teal-600 transition-opacity group-hover:opacity-95"
                    />

                    {/* Bottom: Violation portion (Muted Professional Red #DC2626) */}
                    {day.violations > 0 && (
                      <div
                        style={{ height: `${violationPct}%`, minHeight: '3px' }}
                        className="w-full bg-rose-600/85 dark:bg-rose-500/85 transition-opacity group-hover:opacity-95"
                      />
                    )}
                  </div>
                </div>

                {/* Date Label: 11-12px Muted Slate */}
                <span
                  className={`text-[11px] transition-colors font-medium ${
                    isHovered ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {dateLabel}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </CardContent>
    </Card>
  );
};
