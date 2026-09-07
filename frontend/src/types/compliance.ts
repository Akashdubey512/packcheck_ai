import { BoundingBox, Product } from './scan';

export type ComplianceStatus = 'compliant' | 'violation' | 'review' | 'info';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ComplianceCheck {
  id: string;
  ruleId: string;
  ruleName: string;
  ruleCategory: 'packaging' | 'labeling' | 'ingredients' | 'statutory' | 'pricing' | 'origin';
  status: ComplianceStatus;
  severity: SeverityLevel;
  message: string;
  legalReference: string;
  confidenceScore: number;
  decisionTraceId?: string;
  fieldReference?: string;
}

export interface Violation {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  status: ComplianceStatus;
  boundingBox?: BoundingBox;
  legalClause: string;
  recommendedAction: string;
  timestamp: string;
}

export interface ComplianceReport {
  id: string;
  scanId: string;
  generatedAt: string;
  generatedBy: string;
  overallStatus: ComplianceStatus;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  reviewChecks: number;
  violations: Violation[];
  checks: ComplianceCheck[];
  productInfo: Product;
  summary: string;
  digitalSignature?: string;
  reportUrl?: string;
}
