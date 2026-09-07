export type EvidenceType =
  | 'ocr_crop'
  | 'metadata_trace'
  | 'batch_hash'
  | 'document_snapshot'
  | 'audit_log';

export interface Evidence {
  id: string;
  scanId: string;
  type: EvidenceType;
  assetUrl: string;
  hashSha256: string;
  timestamp: string;
  metadata: Record<string, string | number | boolean | null>;
  capturedBy?: string;
  verifiedAt?: string;
}

export interface DecisionTraceCondition {
  condition: string;
  expected: string | number | boolean;
  actual: string | number | boolean;
  passed: boolean;
}

export interface DecisionTrace {
  id: string;
  scanId: string;
  ruleId: string;
  ruleName: string;
  evaluatedConditions: DecisionTraceCondition[];
  inputs: Record<string, unknown>;
  outputVerdict: 'PASS' | 'FAIL' | 'FLAG';
  timestamp: string;
  executionEngineVersion: string;
  auditHash: string;
}
