import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="h-3 w-24 bg-surface-muted rounded" />
              <div className="h-7 w-20 bg-surface-muted rounded" />
              <div className="h-2 w-32 bg-surface-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-64">
          <CardContent className="p-4 space-y-4">
            <div className="h-4 w-48 bg-surface-muted rounded" />
            <div className="h-40 bg-surface-muted rounded" />
          </CardContent>
        </Card>
        <Card className="h-64">
          <CardContent className="p-4 space-y-4">
            <div className="h-4 w-48 bg-surface-muted rounded" />
            <div className="h-40 bg-surface-muted rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
