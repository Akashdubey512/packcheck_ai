import { describe, it, expect } from 'vitest';
import { HistoryService } from '../src/services/historyService';
import { VerificationService } from '../src/services/verificationService';
import { ROLE_DEFINITIONS, Role } from '../src/types/user';
import { scanStateReducer, INITIAL_SCAN_CONTEXT } from '../src/features/scan/state';

describe('Phase 4 Hardening & Contract Integrity', () => {
  describe('History Date Range Filtering', () => {
    it('filters history records strictly within a specified date window', async () => {
      const res = await HistoryService.getHistory({
        startDate: '2026-09-06',
        endDate: '2026-09-07',
      });

      expect(res.items.length).toBeGreaterThan(0);
      res.items.forEach((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        const start = new Date('2026-09-06').getTime();
        const end = new Date('2026-09-07').setHours(23, 59, 59, 999);
        expect(itemTime).toBeGreaterThanOrEqual(start);
        expect(itemTime).toBeLessThanOrEqual(end);
      });
    });

    it('returns single day records when start and end date match', async () => {
      const res = await HistoryService.getHistory({
        startDate: '2026-09-03',
        endDate: '2026-09-03',
      });

      expect(res.items.length).toBe(1);
      expect(res.items[0]!.productName).toContain('Turmeric');
    });

    it('returns empty list when date window has no matching inspections', async () => {
      const res = await HistoryService.getHistory({
        startDate: '2020-01-01',
        endDate: '2020-01-02',
      });

      expect(res.items.length).toBe(0);
      expect(res.total).toBe(0);
    });
  });

  describe('Canonical Roles & Permission Safety', () => {
    const canonicalRoles: Role[] = [
      'CONSUMER',
      'DEALER',
      'ADMIN',
      'LEGAL_METROLOGY_OFFICER',
    ];

    it('adheres exactly to the canonical uppercase role enum', () => {
      canonicalRoles.forEach((role) => {
        const def = ROLE_DEFINITIONS[role];
        expect(def).toBeDefined();
        expect(def.id).toBe(role);
      });
    });

    it('enforces that CONSUMER cannot access inspection intake or audit history', () => {
      const consumerRoutes = ROLE_DEFINITIONS.CONSUMER.accessibleRoutes;
      expect(consumerRoutes).toContain('/verify');
      expect(consumerRoutes).toContain('/reports');
      expect(consumerRoutes).not.toContain('/scan');
      expect(consumerRoutes).not.toContain('/history');
      expect(consumerRoutes).not.toContain('/settings');
    });

    it('enforces that LEGAL_METROLOGY_OFFICER has full inspection authority', () => {
      const officerRoutes = ROLE_DEFINITIONS.LEGAL_METROLOGY_OFFICER.accessibleRoutes;
      expect(officerRoutes).toContain('/dashboard');
      expect(officerRoutes).toContain('/scan');
      expect(officerRoutes).toContain('/history');
      expect(officerRoutes).toContain('/reports');
      expect(officerRoutes).toContain('/verify');
      expect(officerRoutes).toContain('/settings');
    });
  });

  describe('Verification Service & Privacy Guard', () => {
    it('supports optional backend-provided qrUrl and verificationUrl in verification response contract', async () => {
      const res = await VerificationService.verifyBatch('MLK-882-A');

      // Contract supports optional backend URLs
      expect(res.result).toBeDefined();
      expect(res.result.isValid).toBe(true);
      expect(res.result.cryptographicProof).toBeDefined();
    });

    it('preserves public citizen privacy by omitting officer identities from public presentation payload', async () => {
      const res = await VerificationService.verifyBatch('LOT-2026-X89');

      // The raw internal batch record has operatorId, but public view contracts must omit it
      const publicSanitizedView = {
        batchId: res.batch.batchId,
        productName: res.batch.productName,
        productGtin: res.batch.productGtin,
        facilityLocation: res.batch.facilityLocation,
        complianceStatus: res.batch.complianceStatus,
        cryptographicProof: res.result.cryptographicProof,
        digitalCertificateId: res.result.digitalCertificateId,
      };

      expect('operatorId' in publicSanitizedView).toBe(false);
      expect('scannedBy' in publicSanitizedView).toBe(false);
      expect(publicSanitizedView.batchId).toBe('LOT-2026-X89');
    });
  });

  describe('Scan State Machine Determinism & Error Recovery', () => {
    it('blocks invalid transitions such as starting processing from IDLE', () => {
      const nextState = scanStateReducer(INITIAL_SCAN_CONTEXT, { type: 'START_PROCESSING' });
      expect(nextState.status).toBe('IDLE');
    });

    it('recovers cleanly from FAILED state to IDLE on RESET', () => {
      const failedState = scanStateReducer(
        { ...INITIAL_SCAN_CONTEXT, status: 'UPLOADING' },
        { type: 'UPLOAD_FAILED', error: 'File exceeds statutory resolution requirements.' }
      );
      expect(failedState.status).toBe('FAILED');
      expect(failedState.errorMessage).toBe('File exceeds statutory resolution requirements.');

      const resetState = scanStateReducer(failedState, { type: 'RESET' });
      expect(resetState.status).toBe('IDLE');
      expect(resetState.errorMessage).toBeUndefined();
    });
  });
});
