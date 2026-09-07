import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Home } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto p-3 rounded-full bg-review-surface text-review w-fit mb-2">
            <AlertTriangle size={24} />
          </div>
          <CardTitle>404 — Statutory Resource Not Found</CardTitle>
          <CardDescription>
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
    </div>
  );
};
