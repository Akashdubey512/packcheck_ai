import React from 'react';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export type StatusType = 'compliant' | 'violation' | 'review' | 'info';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  customText?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<
  StatusType,
  {
    icon: LucideIcon;
    defaultLabel: string;
    containerClass: string;
    iconClass: string;
    badgePrefix: string;
  }
> = {
  compliant: {
    icon: CheckCircle2,
    defaultLabel: 'Compliant',
    badgePrefix: 'STATUS: PASS',
    containerClass: 'bg-compliant-surface text-compliant-foreground border-compliant-border',
    iconClass: 'text-compliant',
  },
  violation: {
    icon: AlertOctagon,
    defaultLabel: 'Violation',
    badgePrefix: 'STATUS: FAIL',
    containerClass: 'bg-violation-surface text-violation-foreground border-violation-border',
    iconClass: 'text-violation',
  },
  review: {
    icon: AlertTriangle,
    defaultLabel: 'Review Required',
    badgePrefix: 'STATUS: ATTN',
    containerClass: 'bg-review-surface text-review-foreground border-review-border',
    iconClass: 'text-review',
  },
  info: {
    icon: Info,
    defaultLabel: 'Informational',
    badgePrefix: 'STATUS: INFO',
    containerClass: 'bg-info-surface text-info-foreground border-info-border',
    iconClass: 'text-info',
  },
};

/**
 * StatusBadge enforces the core requirement:
 * Status MUST NEVER rely only on color. It always renders:
 * 1. An explicit semantic Icon
 * 2. A formal Status Prefix label (e.g. PASS/FAIL/ATTN/INFO)
 * 3. Human-readable descriptive Text
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  customText,
  showIcon = true,
  size = 'md',
  className,
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayText = customText || label || config.defaultLabel;

  const sizeClasses = {
    sm: 'text-2xs py-0.5 px-2 gap-1',
    md: 'text-xs py-1 px-2.5 gap-1.5',
    lg: 'text-sm py-1.5 px-3 gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      role="status"
      aria-label={`${config.defaultLabel}: ${displayText}`}
      className={cn(
        'inline-flex items-center font-medium border rounded select-none',
        config.containerClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} className={cn('shrink-0', config.iconClass)} aria-hidden="true" />}
      <span className="font-semibold uppercase tracking-wider opacity-75">{config.badgePrefix}</span>
      <span className="font-normal opacity-40">|</span>
      <span>{displayText}</span>
    </span>
  );
};
