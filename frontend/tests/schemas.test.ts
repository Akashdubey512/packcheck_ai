import { describe, it, expect } from 'vitest';
import {
  scanSchema,
  complianceReportSchema,
  dashboardMetricsSchema,
  verificationResultSchema,
  historyResponseSchema,
} from '../src/schemas';

describe('Zod Domain Validation Schemas', () => {
  it('should validate a valid Scan model payload', () => {
    const validScan = {
      id: 'scn_001',
      fileName: 'label_test.jpg',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      fileUrl: 'https://example.com/scan.jpg',
      status: 'COMPLETED' as const,
      uploadedAt: '2026-09-07T12:00:00Z',
      ocrRegions: [
        {
          id: 'ocr_1',
          boundingBox: { x: 10, y: 10, width: 100, height: 50 },
          confidence: 0.95,
          detectedText: 'Sample text',
        },
      ],
      extractedFields: [
        {
          fieldName: 'brand',
          label: 'Brand Name',
          rawValue: 'Sample text',
          normalizedValue: 'Sample text',
          confidence: 0.95,
          status: 'valid' as const,
        },
      ],
      complianceVerdict: 'compliant' as const,
      overallScore: 98,
    };

    const parsed = scanSchema.safeParse(validScan);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid scan status', () => {
    const invalidScan = {
      id: 'scn_002',
      fileName: 'label.jpg',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      fileUrl: 'https://example.com/scan.jpg',
      status: 'INVALID_STATUS',
      uploadedAt: '2026-09-07T12:00:00Z',
      ocrRegions: [],
      extractedFields: [],
    };

    const parsed = scanSchema.safeParse(invalidScan);
    expect(parsed.success).toBe(false);
  });

  it('should validate a complete compliance report', () => {
    const report = {
      id: 'rep_001',
      scanId: 'scn_001',
      generatedAt: '2026-09-07T12:00:00Z',
      generatedBy: 'Central Audit Engine',
      overallStatus: 'compliant' as const,
      totalChecks: 1,
      passedChecks: 1,
      failedChecks: 0,
      reviewChecks: 0,
      violations: [],
      checks: [
        {
          id: 'chk_1',
          ruleId: 'RULE_01',
          ruleName: 'Net Quantity',
          ruleCategory: 'packaging' as const,
          status: 'compliant' as const,
          severity: 'high' as const,
          message: 'Passed',
          legalReference: 'Clause 1',
          confidenceScore: 0.95,
        },
      ],
      productInfo: {
        id: 'prod_1',
        name: 'Product A',
        gtin: '8901030000001',
        manufacturer: 'Manufacturer A',
        category: 'Food',
      },
      summary: 'All requirements satisfied.',
    };

    const parsed = complianceReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);
  });

  it('should validate dashboard metrics schema', () => {
    const metrics = {
      totalScans: 100,
      complianceRate: 98.5,
      activeViolations: 2,
      pendingReviews: 5,
      scansToday: 12,
      criticalAlertsCount: 0,
      scansByCategory: [
        { category: 'Dairy', total: 50, compliant: 49, violations: 1, rate: 98 },
      ],
      scansTimeline: [
        { date: '2026-09-07', total: 12, compliant: 12, violations: 0 },
      ],
      recentActivity: [
        {
          id: 'act_1',
          type: 'scan' as const,
          title: 'Scan verified',
          timestamp: 'Just now',
          status: 'compliant' as const,
          actor: 'Inspector 1',
        },
      ],
    };

    const parsed = dashboardMetricsSchema.safeParse(metrics);
    expect(parsed.success).toBe(true);
  });

  it('should validate verification result schema', () => {
    const verification = {
      batchId: 'BATCH_99',
      verifiedAt: '2026-09-07T12:00:00Z',
      isValid: true,
      cryptographicProof: 'SHA256:abcd...',
      matchesRegistry: true,
      ledgerTimestamp: '2026-09-07T12:00:00Z',
      violationsCount: 0,
      recordsCount: 5000,
      issuerAuthority: 'Authority Desk',
      digitalCertificateId: 'CERT_123',
    };

    const parsed = verificationResultSchema.safeParse(verification);
    expect(parsed.success).toBe(true);
  });

  it('should validate history response schema', () => {
    const history = {
      items: [
        {
          id: 'hist_1',
          scanId: 'scn_1',
          productName: 'Product 1',
          gtin: '8901030000001',
          status: 'compliant' as const,
          timestamp: '2026-09-07T12:00:00Z',
          violationCount: 0,
          complianceScore: 100,
          scannedBy: 'Auditor A',
          category: 'Beverage',
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    const parsed = historyResponseSchema.safeParse(history);
    expect(parsed.success).toBe(true);
  });
});
