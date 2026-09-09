import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isDemoMode } from '@/app/config/env';
import { ComplianceReport } from '@/types/compliance';

const MOCK_REPORTS_DATABASE: ComplianceReport[] = [];

export const ReportService = {
  async getReports(): Promise<ComplianceReport[]> {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.REPORTS.LIST);
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      if (list.length > 0) return list;
      return MOCK_REPORTS_DATABASE;
    } catch {
      return MOCK_REPORTS_DATABASE;
    }
  },

  async getReportById(id: string): Promise<ComplianceReport> {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.REPORTS.GET_BY_ID(id));
      if (res?.data) return res.data;
      if (res?.id) return res;
    } catch {
      // Fallback to local memory
    }
    const report = MOCK_REPORTS_DATABASE.find((r) => r.id === id || r.scanId === id);
    if (report) return report;
    throw new Error(`Report "${id}" not found.`);
  },

  async generateReport(scanId: string, title?: string): Promise<ComplianceReport> {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newReport: ComplianceReport = {
        id: `REP_${Date.now().toString().slice(-6)}`,
        scanId,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Central Compliance Inspection Engine',
        overallStatus: 'compliant',
        totalChecks: 9,
        passedChecks: 9,
        failedChecks: 0,
        reviewChecks: 0,
        violations: [],
        checks: [],
        productInfo: {
          id: `prod_${Date.now()}`,
          name: title || 'Inspected Product Package',
          gtin: '8901030829104',
          manufacturer: 'Inspection Facility',
          category: 'Packaged Commodities',
          batchNumber: 'LOT-STATUTORY-INSP',
        },
        summary:
          'Statutory compliance assessment record generated for packaging compliance audit file.',
        digitalSignature: `AUTH-DIGITAL-SIGNATURE-${Date.now()}`,
      };
      MOCK_REPORTS_DATABASE.unshift(newReport);
      return newReport;
    }

    return apiClient.post<ComplianceReport>(API_ENDPOINTS.REPORTS.GENERATE, { scanId, title });
  },
};
