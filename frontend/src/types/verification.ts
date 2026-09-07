import { ComplianceStatus } from './compliance';

export interface BatchRecord {
  id: string;
  batchId: string;
  productGtin: string;
  productName: string;
  unitCount: number;
  complianceStatus: ComplianceStatus;
  timestamp: string;
  verificationHash: string;
  operatorId: string;
  facilityLocation: string;
  qrUrl?: string; // Optional backend-provided QR asset URL
  verificationUrl?: string; // Optional backend-provided verification URL
}

export interface VerificationResult {
  batchId: string;
  verifiedAt: string;
  isValid: boolean;
  cryptographicProof: string;
  matchesRegistry: boolean;
  ledgerTimestamp: string;
  violationsCount: number;
  recordsCount: number;
  issuerAuthority: string;
  digitalCertificateId: string;
  qrUrl?: string; // Optional backend-provided QR image asset URL
  verificationUrl?: string; // Optional backend-provided verification URL
}
