import { describe, it, expect } from 'vitest';
import { formatFileSize, formatGTIN, formatConfidenceScore } from '../src/utils/formatters';
import { VerificationService } from '../src/services/verificationService';
import { ScanService } from '../src/services/scanService';
import { ComplianceService } from '../src/services/complianceService';
import { ROUTES } from '../src/constants/routes';

describe('Phase 5 — Final QA & SIH Demo Readiness', () => {
  describe('Data Formatters & Typography Utilities', () => {
    it('formats file sizes accurately across B, KB, and MB scales', () => {
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(50 * 1024)).toBe('50.0 KB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.50 MB');
      expect(formatFileSize(25 * 1024 * 1024)).toBe('25.00 MB');
    });

    it('formats GTIN numbers with canonical 4-digit spacing', () => {
      expect(formatGTIN('8901030829104')).toBe('8901 0308 2910 4');
      expect(formatGTIN('')).toBe('—');
    });

    it('formats confidence scores as percentage strings', () => {
      expect(formatConfidenceScore(0.985)).toBe('99%');
      expect(formatConfidenceScore(0.42)).toBe('42%');
      expect(formatConfidenceScore(1.0)).toBe('100%');
    });
  });

  describe('Verification Service — Unverified & Error Scenarios', () => {
    it('returns an unregistered record when checking an unknown or invalid batch', async () => {
      const res = await VerificationService.verifyBatch('UNREGISTERED_BATCH_99');
      expect(res.result.isValid).toBe(false);
      expect(res.result.matchesRegistry).toBe(false);
      expect(res.batch.complianceStatus).toBe('violation');
      expect(res.result.cryptographicProof).toBe('UNREGISTERED_RECORD');
    });

    it('returns an unverified record for INVALID batch input', async () => {
      const res = await VerificationService.verifyBatch('INVALID');
      expect(res.result.isValid).toBe(false);
      expect(res.result.matchesRegistry).toBe(false);
      expect(res.result.digitalCertificateId).toBe('UNVERIFIED');
    });

    it('rejects with network connection error when connection error is simulated', async () => {
      await expect(VerificationService.verifyBatch('FAIL_CONN')).rejects.toThrow(
        'Failed to establish connection'
      );
    });
  });

  describe('Scan & Compliance Services — Actionable Error Guard', () => {
    it('rejects invalid scan IDs in ScanService.getScan to allow UI error recovery', async () => {
      await expect(ScanService.getScan('scn_invalid_unknown')).rejects.toThrow(
        'Inspection record not found'
      );
    });

    it('rejects invalid scan IDs in ComplianceService.getComplianceCheck', async () => {
      await expect(ComplianceService.getComplianceCheck('scn_invalid_unknown')).rejects.toThrow(
        'Compliance assessment record not found'
      );
    });

    it('resolves valid scans normally for dairy and cereal presets', async () => {
      const dairy = await ScanService.getScan('scn_sample_dairy_compliant');
      expect(dairy.product?.category).toBe('Dairy Products');
      expect(dairy.status).toBe('COMPLETED');

      const cereal = await ScanService.getScan('scn_sample_cereal_violations');
      expect(cereal.product?.name).toContain('Apex');
      expect(cereal.status).toBe('COMPLETED');
    });
  });

  describe('Route Integrity & Master Specification Compliance', () => {
    it('provides valid route paths for primary and secondary landing CTAs', () => {
      expect(ROUTES.SCAN).toBe('/scan');
      expect(ROUTES.VERIFY).toBe('/verify');
      expect(ROUTES.HISTORY).toBe('/history');
      expect(ROUTES.REPORTS).toBe('/reports');
      expect(ROUTES.DASHBOARD).toBe('/dashboard');
    });
  });
});
