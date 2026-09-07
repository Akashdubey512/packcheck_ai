import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { CategoryMetric } from '@/types/dashboard';
import { PieChart } from 'lucide-react';

interface ViolationDistributionProps {
  categories: CategoryMetric[];
}

export const ViolationDistribution: React.FC<ViolationDistributionProps> = ({ categories }) => {
  return (
    <Card>
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <PieChart size={16} className="text-primary" />
          <CardTitle className="text-xs uppercase tracking-wider">
            Category Compliance &amp; Violation Distribution
          </CardTitle>
        </div>
        <CardDescription>
          Compliance pass ratios categorized by statutory food and commodity groups
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {categories.map((cat) => {
          const isHealthy = cat.rate >= 95;
          return (
            <div key={cat.category} className="space-y-1.5 text-xs">
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
              <div className="w-full h-2 rounded bg-surface-muted overflow-hidden border border-border/60">
                <div
                  className={`h-full transition-all duration-300 ${
                    isHealthy ? 'bg-compliant' : 'bg-violation'
                  }`}
                  style={{ width: `${cat.rate}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
