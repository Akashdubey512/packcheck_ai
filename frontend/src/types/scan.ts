export type ScanStatus =
  | 'IDLE'
  | 'UPLOADING'
  | 'READY'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRRegion {
  id: string;
  boundingBox: BoundingBox;
  confidence: number; // 0.0 to 1.0
  detectedText: string;
  orientation?: number;
  pageNumber?: number;
}

export interface ExtractedField {
  fieldName: string;
  label: string;
  rawValue: string;
  normalizedValue: string;
  confidence: number;
  status: 'valid' | 'invalid' | 'uncertain' | 'missing';
  ocrRegionId?: string;
  sourceLocation?: BoundingBox;
}

export interface Product {
  id: string;
  name: string;
  gtin: string; // Global Trade Item Number / Barcode
  manufacturer: string;
  category: string;
  batchNumber?: string;
  mfgDate?: string;
  expDate?: string;
  netWeight?: string;
  fssaiLicenseNumber?: string;
}

export interface Scan {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  status: ScanStatus;
  uploadedAt: string;
  processedAt?: string;
  product?: Product;
  ocrRegions: OCRRegion[];
  extractedFields: ExtractedField[];
  complianceVerdict?: 'compliant' | 'violation' | 'review' | 'info';
  overallScore?: number;
}
