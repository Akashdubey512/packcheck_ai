import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DashboardMetrics } from '@/types/dashboard';
import { buildRoute, ROUTES } from '@/constants/routes';
import { Activity, ArrowRight, ExternalLink } from 'lucide-react';
import { staggerContainer, staggerItem, butterSpring, gpuAcceleratedStyle } from '@/animations/motion';

interface RecentInspectionsProps {
  recentActivity: DashboardMetrics['recentActivity'];
}

export const RecentInspections: React.FC<RecentInspectionsProps> = ({ recentActivity }) => {
  const navigate = useNavigate();

  return (
    <Card className="border border-border shadow-card">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-primary/10 text-primary">
              <Activity size={16} />
            </span>
            <CardTitle className="text-xs uppercase tracking-wider">
              Recent Statutory Inspections
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 text-primary"
            onClick={() => navigate(ROUTES.HISTORY)}
          >
            All Audit Records <ArrowRight size={13} className="ml-1" />
          </Button>
        </div>
        <CardDescription>
          Live inspection pipeline activity feed with direct links to full evidence assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={gpuAcceleratedStyle}
          className="space-y-3"
        >
          {recentActivity.map((item) => (
            <motion.div
              key={item.id}
              variants={staggerItem}
              whileHover={{ x: 4 }}
              transition={butterSpring}
              className="p-3 rounded-lg border border-border bg-surface hover:bg-surface-muted/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.status} size="sm" />
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                </div>
                <div className="text-2xs text-slate-500 font-mono">
                  Operator: {item.actor} • {item.timestamp}
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-2xs shrink-0 self-start sm:self-auto"
                onClick={() => {
                  if (item.status === 'violation') {
                    navigate(buildRoute.scanDetail('scn_sample_cereal_violations'));
                  } else {
                    navigate(buildRoute.scanDetail('scn_sample_dairy_compliant'));
                  }
                }}
              >
                <ExternalLink size={12} className="mr-1" /> View Inspection
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
};

