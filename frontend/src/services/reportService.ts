import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isDemoMode } from '@/app/config/env';
import { ComplianceReport } from '@/types/compliance';

const MOCK_REPORTS_DATABASE: ComplianceReport[] = [
  {
    id: 'rep_2026_001',
    scanId: 'scn_sample_dairy_compliant',
    generatedAt: '2026-09-07T11:00:00Z',
    generatedBy: 'Central Compliance Audit Engine (Auth ID: LMO-IND-8912)',
    overallStatus: 'compliant',
    totalChecks: 18,
    passedChecks: 18,
    failedChecks: 0,
    reviewChecks: 0,
    violations: [],
    checks: [],
    productInfo: {
      id: 'prod_101',
      name: 'Apex Standardized Pasteurized Milk 1L',
      gtin: '8901030999011',
      manufacturer: 'Apex Dairy Farms Ltd.',
      category: 'Dairy Products',
      batchNumber: 'MLK-882-A',
      mfgDate: '2026-09-07',
      expDate: '2026-09-09',
      netWeight: '1000ml',
      fssaiLicenseNumber: '10012011000999',
    },
    summary:
      'All statutory labeling, allergen warnings, FSSAI licensing, and net metrology parameters conform to national regulatory requirements under the Legal Metrology (Packaged Commodities) Rules 2011.',
    digitalSignature: 'SIG-RSA4096-788102919248A',
  },
  {
    id: 'rep_2026_002',
    scanId: 'scn_sample_cereal_violations',
    generatedAt: '2026-09-07T10:15:00Z',
    generatedBy: 'Enforcement Bureau Division 4 (Auth ID: LMO-IND-8912)',
    overallStatus: 'violation',
    totalChecks: 18,
    passedChecks: 15,
    failedChecks: 2,
    reviewChecks: 1,
    violations: [
      {
        id: 'viol_rep_01',
        ruleId: 'LM_SEC_6_1_D_EXP',
        title: 'Mandatory Expiry / Best Before Declaration Omitted',
        description: 'Failed to declare calendar date or period from manufacture.',
        severity: 'critical',
        status: 'violation',
        legalClause: 'Legal Metrology Rules 2011, Rule 6(1)(d)',
        recommendedAction: 'Quarantine batch LOT-2026-X89; issue formal notice.',
        timestamp: '2026-09-07T10:14:00Z',
      },
      {
        id: 'viol_rep_02',
        ruleId: 'LM_SEC_7_1_FONT_SIZE',
        title: 'Net Quantity Numeral Height Below Statutory 4.0mm Minimum',
        description: 'Measured numeral height 1.8mm against statutory 4.0mm requirement.',
        severity: 'high',
        status: 'violation',
        legalClause: 'Legal Metrology Rules 2011, Rule 7(1), Table 1',
        recommendedAction: 'Mandatory packaging plate typography revision.',
        timestamp: '2026-09-07T10:14:00Z',
      },
    ],
    checks: [],
    productInfo: {
      id: 'prod_9082',
      name: 'Apex Fortified Multi-Grain Flakes 500g',
      gtin: '8901030829104',
      manufacturer: 'Apex Nutrition Consumer Ltd.',
      category: 'Packaged Food / Cereals',
      batchNumber: 'LOT-2026-X89',
      mfgDate: '2026-06-15',
      netWeight: '500g',
      fssaiLicenseNumber: '10012011000189',
    },
    summary:
      'STATUTORY NON-COMPLIANCE NOTICE: Inspection revealed critical omission of statutory expiry date and numeral height violation. Corrective recall notice initiated.',
    digitalSignature: 'SIG-RSA4096-99014281920B',
  },
  {
    id: 'rep_2026_003',
    scanId: 'scn_sample_tea_review',
    generatedAt: '2026-09-06T17:00:00Z',
    generatedBy: 'Central Compliance Audit Engine',
    overallStatus: 'review',
    totalChecks: 18,
    passedChecks: 17,
    failedChecks: 0,
    reviewChecks: 1,
    violations: [],
    checks: [],
    productInfo: {
      id: 'prod_103',
      name: 'Botanical Herbal Green Tea 100g',
      gtin: '8901030999035',
      manufacturer: 'Botanical Herbals India Pvt Ltd.',
      category: 'Beverages',
      batchNumber: 'TEA-412-F',
      mfgDate: '2026-08-01',
      expDate: '2028-08-01',
      netWeight: '100g',
      fssaiLicenseNumber: '10012011000333',
    },
    summary:
      'All mandatory declarations present; serving size breakdown table flagged for auditor manual sign-off.',
    digitalSignature: 'SIG-RSA4096-10294819284C',
  },
];

export const ReportService = {
  async getReports(): Promise<ComplianceReport[]> {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_REPORTS_DATABASE;
    }
    return apiClient.get<ComplianceReport[]>(API_ENDPOINTS.REPORTS.LIST);
  },

  async getReportById(id: string): Promise<ComplianceReport> {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const report = MOCK_REPORTS_DATABASE.find((r) => r.id === id || r.scanId === id);
      if (report) return report;
      return MOCK_REPORTS_DATABASE[0]!;
    }
    return apiClient.get<ComplianceReport>(API_ENDPOINTS.REPORTS.GET_BY_ID(id));
  },

  async generateReport(scanId: string, title?: string): Promise<ComplianceReport> {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newReport: ComplianceReport = {
        id: `rep_${Date.now().toString().slice(-6)}`,
        scanId,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Central Compliance Inspection Engine',
        overallStatus: scanId.includes('cereal') ? 'violation' : 'compliant',
        totalChecks: 18,
        passedChecks: scanId.includes('cereal') ? 15 : 18,
        failedChecks: scanId.includes('cereal') ? 2 : 0,
        reviewChecks: 0,
        violations: scanId.includes('cereal') ? MOCK_REPORTS_DATABASE[1]!.violations : [],
        checks: [],
        productInfo: {
          id: 'prod_gen_1',
          name: title || 'Inspected Product Package',
          gtin: '8901030829104',
          manufacturer: 'Apex Nutrition Consumer Ltd.',
          category: 'Packaged Commodities',
          batchNumber: 'LOT-2026-X89',
        },
        summary:
          'Statutory compliance assessment record generated for packaging compliance audit file.',
        digitalSignature: `SIG-RSA4096-${Date.now()}`,
      };
      MOCK_REPORTS_DATABASE.unshift(newReport);
      return newReport;
    }

    return apiClient.post<ComplianceReport>(API_ENDPOINTS.REPORTS.GENERATE, { scanId, title });
  },
};
