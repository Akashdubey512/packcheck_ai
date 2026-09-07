import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isDemoMode } from '@/app/config/env';
import { VerificationResult, BatchRecord } from '@/types/verification';

export interface BatchVerificationResponse {
  result: VerificationResult;
  batch: BatchRecord;
}

const MOCK_BATCH_REGISTRY: Record<string, BatchVerificationResponse> = {
  'LOT-2026-X89': {
    batch: {
      id: 'rec_LOT-2026-X89',
      batchId: 'LOT-2026-X89',
      productGtin: '8901030829104',
      productName: 'Apex Fortified Multi-Grain Flakes 500g',
      unitCount: 12500,
      complianceStatus: 'violation',
      timestamp: '2026-06-15T08:00:00Z',
      verificationHash: '4f8b2b7194f4d2f8647248e3cf75836c843075c3ef90fa96a0fcf6d649dbb184',
      operatorId: 'OPR-IND-902', // Internal only - must be stripped for public view
      facilityLocation: 'Manufacturing Plant 04, Greater Noida, UP',
    },
    result: {
      batchId: 'LOT-2026-X89',
      verifiedAt: '2026-09-07T10:14:00Z',
      isValid: false, // Flagged for statutory non-compliance
      cryptographicProof: 'SHA256:4f8b2b7194f4d2f8647248e3cf75836c843075c3ef90fa96a0fcf6d649dbb184',
      matchesRegistry: true,
      ledgerTimestamp: '2026-09-07T10:14:00Z',
      violationsCount: 2,
      recordsCount: 12500,
      issuerAuthority: 'Directorate of Legal Metrology National Registry',
      digitalCertificateId: 'CERT-FLAG-2026-8910',
    },
  },
  'MLK-882-A': {
    batch: {
      id: 'rec_MLK-882-A',
      batchId: 'MLK-882-A',
      productGtin: '8901030999011',
      productName: 'Apex Standardized Pasteurized Milk 1L',
      unitCount: 25000,
      complianceStatus: 'compliant',
      timestamp: '2026-09-07T04:30:00Z',
      verificationHash: 'a98c012847190f84a8b7190248a192840b719284102948a19284b1208910abcd',
      operatorId: 'OPR-DAIRY-012',
      facilityLocation: 'Apex Cooperative Dairy Plant 01, Anand, Gujarat',
    },
    result: {
      batchId: 'MLK-882-A',
      verifiedAt: '2026-09-07T09:30:00Z',
      isValid: true,
      cryptographicProof: 'SHA256:a98c012847190f84a8b7190248a192840b719284102948a19284b1208910abcd',
      matchesRegistry: true,
      ledgerTimestamp: '2026-09-07T09:30:00Z',
      violationsCount: 0,
      recordsCount: 25000,
      issuerAuthority: 'National Dairy & Food Authority Electronic Registry',
      digitalCertificateId: 'CERT-PASS-2026-9901',
    },
  },
};

export const VerificationService = {
  async verifyBatch(batchId: string): Promise<BatchVerificationResponse> {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 350));

      const normalized = batchId.trim().toUpperCase();
      if (normalized === 'ERROR' || normalized === 'FAIL_CONN') {
        throw new Error(`Failed to establish connection to national regulatory ledger for "${batchId}".`);
      }

      if (MOCK_BATCH_REGISTRY[normalized]) {
        return MOCK_BATCH_REGISTRY[normalized]!;
      }

      if (
        normalized === 'INVALID' ||
        normalized.includes('NOT_FOUND') ||
        normalized.includes('UNREGISTERED') ||
        normalized.includes('UNVERIFIED')
      ) {
        return {
          batch: {
            id: `rec_${normalized}`,
            batchId: normalized,
            productGtin: '0000000000000',
            productName: 'Unregistered Batch Commodity',
            unitCount: 0,
            complianceStatus: 'violation',
            timestamp: new Date().toISOString(),
            verificationHash: '0000000000000000000000000000000000000000000000000000000000000000',
            operatorId: 'OPR-UNVERIFIED',
            facilityLocation: 'Unknown Packaging Facility',
          },
          result: {
            batchId: normalized,
            verifiedAt: new Date().toISOString(),
            isValid: false,
            cryptographicProof: 'UNREGISTERED_RECORD',
            matchesRegistry: false,
            ledgerTimestamp: new Date().toISOString(),
            violationsCount: 1,
            recordsCount: 0,
            issuerAuthority: 'National Regulatory Electronic Compliance Registry',
            digitalCertificateId: 'UNVERIFIED',
          },
        };
      }

      // Default dynamic batch record
      return {
        batch: {
          id: `rec_${normalized}`,
          batchId: normalized,
          productGtin: '8901030999035',
          productName: 'Botanical Pure Herbal Green Tea 100g',
          unitCount: 8000,
          complianceStatus: 'compliant',
          timestamp: '2026-08-01T00:00:00Z',
          verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          operatorId: 'OPR-BOT-09',
          facilityLocation: 'Botanical Herbals Packaging Facility, Dehradun, UK',
        },
        result: {
          batchId: normalized,
          verifiedAt: new Date().toISOString(),
          isValid: true,
          cryptographicProof: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          matchesRegistry: true,
          ledgerTimestamp: new Date().toISOString(),
          violationsCount: 0,
          recordsCount: 8000,
          issuerAuthority: 'National Regulatory Electronic Compliance Registry',
          digitalCertificateId: `CERT-REG-${Date.now().toString().slice(-6)}`,
        },
      };
    }

    return apiClient.get<BatchVerificationResponse>(API_ENDPOINTS.VERIFICATION.GET_BY_BATCH_ID(batchId));
  },
};
