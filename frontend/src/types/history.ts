import { ComplianceStatus } from './compliance';

export interface HistoryItem {
  id: string;
  scanId: string;
  productName: string;
  gtin: string;
  status: ComplianceStatus;
  timestamp: string;
  violationCount: number;
  complianceScore: number; // 0 - 100
  scannedBy: string;
  category: string;
  batchNumber?: string;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
