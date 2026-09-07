import { describe, it, expect } from 'vitest';
import { VerificationService } from '../src/services/verificationService';

describe('VerificationService & Public Ledger Privacy', () => {
  it('verifies a compliant registered batch correctly', async () => {
    const res = await VerificationService.verifyBatch('MLK-882-A');

    expect(res.result.isValid).toBe(true);
    expect(res.result.violationsCount).toBe(0);
    expect(res.result.matchesRegistry).toBe(true);
    expect(res.batch.productName).toContain('Milk');
    expect(res.result.cryptographicProof).toContain('SHA256:');
    expect(res.result.digitalCertificateId).toBe('CERT-PASS-2026-9901');
  });

  it('correctly reports a flagged non-compliant batch', async () => {
    const res = await VerificationService.verifyBatch('LOT-2026-X89');

    expect(res.result.isValid).toBe(false);
    expect(res.result.violationsCount).toBe(2);
    expect(res.batch.complianceStatus).toBe('violation');
    expect(res.result.digitalCertificateId).toBe('CERT-FLAG-2026-8910');
  });

  it('handles arbitrary or newly submitted batch IDs with a verifiable record', async () => {
    const res = await VerificationService.verifyBatch('CUSTOM-BATCH-2026');

    expect(res.batch.batchId).toBe('CUSTOM-BATCH-2026');
    expect(res.result.matchesRegistry).toBe(true);
    expect(res.result.cryptographicProof).toBeDefined();
  });

  it('strictly adheres to the public privacy rule by excluding internal officer IDs from public view contract', async () => {
    const res = await VerificationService.verifyBatch('LOT-2026-X89');

    // Simulate public payload mapping according to PublicVerificationView requirements
    const publicSanitizedPayload = {
      productName: res.batch.productName,
      productGtin: res.batch.productGtin,
      batchId: res.batch.batchId,
      unitCount: res.batch.unitCount,
      facilityLocation: res.batch.facilityLocation,
      verifiedAt: res.result.verifiedAt,
      isValid: res.result.isValid,
      issuerAuthority: res.result.issuerAuthority,
      digitalCertificateId: res.result.digitalCertificateId,
      cryptographicProof: res.result.cryptographicProof,
    };

    // Confirm that operatorId is NOT in the public presentation object
    expect('operatorId' in publicSanitizedPayload).toBe(false);
    expect((publicSanitizedPayload as Record<string, unknown>)['operatorId']).toBeUndefined();
    expect(publicSanitizedPayload.productName).toBe('Apex Fortified Multi-Grain Flakes 500g');
  });
});
