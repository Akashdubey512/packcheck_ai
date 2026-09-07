/**
 * Design token constants for programmatic access across the UI.
 * Enforces institutional design guidelines:
 * - 8px spacing rhythm
 * - Non-reliance on color alone for status
 * - Subtle borders and restrained elevations
 */

export const SPACING_RHYTHM = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const COMPLIANCE_STATUS_SEVERITY = {
  COMPLIANT: {
    label: 'Compliant',
    variant: 'compliant',
    iconName: 'CheckCircle2',
    description: 'Meets all statutory regulatory criteria with high confidence.',
  },
  VIOLATION: {
    label: 'Violation',
    variant: 'violation',
    iconName: 'AlertOctagon',
    description: 'Mandatory regulatory failure detected requiring corrective action.',
  },
  REVIEW: {
    label: 'Review Required',
    variant: 'review',
    iconName: 'AlertTriangle',
    description: 'Borderline or low-confidence reading requiring manual verification.',
  },
  INFO: {
    label: 'Informational',
    variant: 'info',
    iconName: 'Info',
    description: 'Advisory or standard metadata trace without enforcement penalty.',
  },
} as const;

export type ComplianceStatusKey = keyof typeof COMPLIANCE_STATUS_SEVERITY;
