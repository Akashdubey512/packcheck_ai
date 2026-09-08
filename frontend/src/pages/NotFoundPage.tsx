import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Home } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { butterSpring, gpuAcceleratedStyle } from '@/animations/motion';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={butterSpring}
        style={gpuAcceleratedStyle}
        className="max-w-md w-full"
      >
        <Card className="text-center border border-border shadow-card">
          <CardHeader>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto p-3.5 rounded-full bg-review-surface text-review w-fit mb-2 border border-review/30 shadow-sm"
            >
              <AlertTriangle size={28} />
            </motion.div>
            <CardTitle className="text-base font-bold">404 — Statutory Resource Not Found</CardTitle>
            <CardDescription className="text-xs">
              The requested module, endpoint, or regulatory record does not exist on this gateway.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500">
              Please verify the route URL or navigate back to the primary operational dashboard.
            </p>
            <Button size="sm" variant="primary" className="w-full" onClick={() => navigate(ROUTES.DASHBOARD)}>
              <Home size={14} className="mr-1.5" /> Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

