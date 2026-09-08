import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { TimelineMetric } from '@/types/dashboard';
import { TrendingUp, Calendar, CheckCircle2, AlertOctagon } from 'lucide-react';
import { butterSpring, staggerContainer, staggerItem, gpuAcceleratedStyle } from '@/animations/motion';

interface ComplianceTrendProps {
  timeline: TimelineMetric[];
}

export const ComplianceTrend: React.FC<ComplianceTrendProps> = ({ timeline }) => {
  const [hoveredDay, setHoveredDay] = useState<TimelineMetric | null>(null);
  const maxDaily = Math.max(...timeline.map((d) => d.total), 300);

  return (
    <Card className="border border-border shadow-card relative overflow-hidden">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-primary/10 text-primary">
              <TrendingUp size={16} />
            </span>
            <CardTitle className="text-xs uppercase tracking-wider">
              Compliance Inspection Trends (Last 7 Days)
            </CardTitle>
          </div>
          <div className="flex items-center gap-3 text-2xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-compliant inline-block" /> Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-violation inline-block" /> Violations
            </span>
          </div>
        </div>
        <CardDescription>
          Daily inspection throughput and statutory infraction distribution
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4 relative">
        {/* Dynamic Interactive Day Tooltip */}
        <div className="h-6 flex items-center justify-between text-2xs font-mono">
          <AnimatePresence mode="wait">
            {hoveredDay ? (
              <motion.div
                key={hoveredDay.date}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 bg-surface-muted px-2.5 py-1 rounded border border-border w-full justify-between"
              >
                <span className="font-semibold text-foreground">Date: {hoveredDay.date}</span>
                <div className="flex items-center gap-3">
                  <span className="text-compliant flex items-center gap-1">
                    <CheckCircle2 size={11} /> {hoveredDay.compliant} Pass
                  </span>
                  <span className="text-violation flex items-center gap-1">
                    <AlertOctagon size={11} /> {hoveredDay.violations} Infractions
                  </span>
                  <span className="text-foreground font-bold">Total: {hoveredDay.total}</span>
                </div>
              </motion.div>
            ) : (
              <span className="text-slate-400 italic">Hover any date column for detailed daily breakdown</span>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={gpuAcceleratedStyle}
          className="grid grid-cols-7 gap-2 items-end h-40 pt-2 pb-1"
        >
          {timeline.map((day) => {
            const compliantPct = Math.round((day.compliant / maxDaily) * 100);
            const violationPct = Math.max(Math.round((day.violations / maxDaily) * 100), 4);
            const dayFormatted = day.date.slice(5); // MM-DD
            const isHovered = hoveredDay?.date === day.date;

            return (
              <motion.div
                key={day.date}
                variants={staggerItem}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                whileHover={{ y: -4 }}
                transition={butterSpring}
                className="flex flex-col items-center gap-1 h-full justify-end group cursor-pointer"
              >
                <div className={`text-[10px] font-mono font-bold transition-all ${
                  isHovered ? 'text-primary scale-110' : 'text-slate-500 opacity-60'
                }`}>
                  {day.total}
                </div>
                <div className={`w-full max-w-[38px] rounded-t flex flex-col justify-end bg-surface-muted overflow-hidden border transition-all h-28 relative ${
                  isHovered ? 'border-primary ring-2 ring-primary/30 shadow-md' : 'border-border'
                }`}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${compliantPct}%` }}
                    transition={butterSpring}
                    className="w-full bg-compliant transition-opacity group-hover:opacity-90"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${violationPct}%` }}
                    transition={butterSpring}
                    className="w-full bg-violation transition-opacity group-hover:opacity-90"
                  />
                </div>
                <span className={`text-[10px] font-mono flex items-center gap-0.5 transition-colors ${
                  isHovered ? 'text-foreground font-bold' : 'text-slate-500'
                }`}>
                  <Calendar size={9} className="opacity-60" />
                  {dayFormatted}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </CardContent>
    </Card>
  );
};


