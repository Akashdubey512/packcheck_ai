export type Role =
  | 'CONSUMER'
  | 'DEALER'
  | 'ADMIN'
  | 'LEGAL_METROLOGY_OFFICER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string;
  badgeNumber?: string;
  organization?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface RoleDefinition {
  id: Role;
  title: string;
  description: string;
  badgeClass: string;
  accessibleRoutes: string[];
}

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  LEGAL_METROLOGY_OFFICER: {
    id: 'LEGAL_METROLOGY_OFFICER',
    title: 'Legal Metrology Officer',
    description: 'Enforcement and statutory package inspection authority with full audit, decision trace, and compliance report issuance privileges.',
    badgeClass: 'bg-institutional-900 text-white dark:bg-sky-500/20 dark:text-sky-300 border-institutional-800',
    accessibleRoutes: ['/', '/dashboard', '/scan', '/history', '/reports', '/verify', '/settings'],
  },
  ADMIN: {
    id: 'ADMIN',
    title: 'System Administrator',
    description: 'Central platform administrator managing system configuration, user access levels, and audit logs.',
    badgeClass: 'bg-purple-900 text-white dark:bg-purple-950 dark:text-purple-300 border-purple-800',
    accessibleRoutes: ['/', '/dashboard', '/scan', '/history', '/reports', '/verify', '/settings'],
  },
  DEALER: {
    id: 'DEALER',
    title: 'Dealer / Manufacturer',
    description: 'Registered industry stakeholder permitted to execute batch integrity checks, lot verification, and download reports.',
    badgeClass: 'bg-blue-900 text-white dark:bg-blue-950 dark:text-blue-300 border-blue-800',
    accessibleRoutes: ['/', '/dashboard', '/verify', '/reports'],
  },
  CONSUMER: {
    id: 'CONSUMER',
    title: 'Consumer / Public Citizen',
    description: 'Public citizen user accessing statutory product verification and published public enforcement notices.',
    badgeClass: 'bg-slate-700 text-white dark:bg-slate-800 dark:text-slate-200 border-slate-600',
    accessibleRoutes: ['/', '/verify', '/reports'],
  },
};
