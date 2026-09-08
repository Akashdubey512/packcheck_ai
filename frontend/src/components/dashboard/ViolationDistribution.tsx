import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { CategoryMetric } from '@/types/dashboard';
import { PieChart } from 'lucide-react';
import { butterSpring, staggerContainer, staggerItem, gpuAcceleratedStyle } from '@/animations/motion';

interface ViolationDistributionProps {
  categories: CategoryMetric[];
}

export const ViolationDistribution: React.FC<ViolationDistributionProps> = ({ categories }) => {
  return (
    <Card className="border border-border shadow-card">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-primary/10 text-primary">
            <PieChart size={16} />
          </span>
          <CardTitle className="text-xs uppercase tracking-wider">
            Category Compliance &amp; Violation Distribution
          </CardTitle>
        </div>
        <CardDescription>
          Compliance pass ratios categorized by statutory food and commodity groups
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={gpuAcceleratedStyle}
          className="space-y-4"
        >
          {categories.map((cat) => {
            const isHealthy = cat.rate >= 95;
            return (
              <motion.div key={cat.category} variants={staggerItem} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{cat.category}</span>
                  <span className="font-mono text-2xs text-slate-500">
                    <strong className={isHealthy ? 'text-compliant' : 'text-violation'}>
                      {cat.rate}% Pass
                    </strong>{' '}
                    ({cat.compliant.toLocaleString()}/{cat.total.toLocaleString()}) •{' '}
                    <span className="text-violation font-bold">{cat.violations} Infractions</span>
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-muted overflow-hidden border border-border/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.rate}%` }}
                    transition={butterSpring}
                    className={`h-full rounded-full ${
                      isHealthy ? 'bg-compliant' : 'bg-violation'
                    }`}
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

