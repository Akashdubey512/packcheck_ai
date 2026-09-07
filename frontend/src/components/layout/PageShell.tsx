import React from 'react';
import { cn } from '@/utils/cn';

interface PageShellProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  description,
  badge,
  actions,
  children,
  className,
}) => {
  return (
    <div className={cn('p-6 space-y-6 max-w-7xl mx-auto w-full', className)}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Main Content Area */}
      <main className="w-full">{children}</main>
    </div>
  );
};
