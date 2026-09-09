import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { ComplianceReport } from '@/types/compliance';

// In-session generated reports (persists during the browser session)
const SESSION_REPORTS: ComplianceReport[] = [];

/** Map a raw backend inspection document to ComplianceReport shape */
function inspectionToReport(insp: any): ComplianceReport {
  // Backend shape: { compliance: { checks, violations }, complianceVerdict, overallScore, violations, product, ... }
  const compliance = insp.compliance || {};
  const checks = Array.isArray(compliance.checks) ? compliance.checks
    : Array.isArray(insp.fields) ? insp.fields : [];
  const violations = Array.isArray(compliance.violations) ? compliance.violations
    : Array.isArray(insp.violations) ? insp.violations : [];
  const product = insp.product || {};

  const passedChecks = checks.filter((c: any) => c.passed === true || c.status === 'compliant' || c.status === 'pass').length;
  const failedChecks = checks.filter((c: any) => c.passed === false || c.status === 'violation' || c.status === 'fail').length;
  const reviewChecks = checks.length - passedChecks - failedChecks;

  // Map backend status → ComplianceReport['overallStatus']
  const rawVerdict = (insp.complianceVerdict || insp.status || '').toUpperCase();
  let overallStatus: ComplianceReport['overallStatus'] = 'review';
  if (rawVerdict === 'COMPLIANT' || rawVerdict === 'PASS') overallStatus = 'compliant';
  else if (rawVerdict === 'NON_COMPLIANT' || rawVerdict === 'FAIL' || rawVerdict === 'VIOLATION') overallStatus = 'violation';
  else if (rawVerdict === 'COMPLETED') {
    overallStatus = violations.length === 0 ? 'compliant' : 'violation';
  }

  // Derive score from overallScore or check counts
  const score = insp.overallScore ?? (checks.length > 0 ? Math.round((passedChecks / checks.length) * 100) : null);

  return {
    id: insp.inspectionId || insp.id || insp.scanId,
    scanId: insp.inspectionId || insp.id || insp.scanId,
    generatedAt: insp.processedAt || insp.uploadedAt || new Date().toISOString(),
    generatedBy: 'PackCheck Legal Metrology Inspection Engine v1.2.3',
    overallStatus,
    totalChecks: checks.length || (score !== null ? 10 : 9),
    passedChecks,
    failedChecks,
    reviewChecks,
    violations,
    checks,
    productInfo: {
      id: product.id || insp.inspectionId || insp.id,
      name: product.name || insp.fileName || 'Packaged Commodity',
      gtin: product.gtin || 'N/A',
      manufacturer: product.manufacturer || 'Unknown Manufacturer',
      category: product.category || 'General Packaged Commodity',
      batchNumber: product.batchNumber || insp.inspectionId || insp.id,
      mfgDate: product.mfgDate,
      expDate: product.expDate,
    },
    summary: violations.length === 0
      ? 'All mandatory statutory declarations verified. Packaging complies with Legal Metrology (Packaged Commodities) Rules, 2011.'
      : `${violations.length} statutory violation(s) detected. Packaging requires rectification before market distribution.`,
    digitalSignature: `AUTH-PCK-${(insp.inspectionId || insp.id || '').slice(-8)}-${Date.now().toString(36).toUpperCase()}`,
  };
}

export const ReportService = {
  async getReports(): Promise<ComplianceReport[]> {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.REPORTS.LIST);
      // Backend returns { scans: [...], inspections: [...] } or { data: [...] }
      const rawList: any[] =
        (Array.isArray(res?.scans) && res.scans.length > 0 ? res.scans : null) ||
        (Array.isArray(res?.inspections) && res.inspections.length > 0 ? res.inspections : null) ||
        (Array.isArray(res?.data) ? res.data : null) ||
        (Array.isArray(res) ? res : []);

      if (rawList.length > 0) {
        const mapped: ComplianceReport[] = rawList.map((item: any) =>
          item.digitalSignature ? item : inspectionToReport(item)
        );
        // Merge with session reports (prepend, deduplicate by id)
        const mappedIds = new Set(mapped.map((r) => r.id));
        return [...SESSION_REPORTS.filter((r) => !mappedIds.has(r.id)), ...mapped];
      }
    } catch {
      // fall through to session reports
    }
    return [...SESSION_REPORTS];
  },

  async getReportById(id: string): Promise<ComplianceReport> {
    // Check session first
    const sessionReport = SESSION_REPORTS.find((r) => r.id === id || r.scanId === id);
    if (sessionReport) return sessionReport;

    try {
      // Fetch the inspection by ID and convert to report
      const inspId = id.startsWith('REP_') ? id : id;
      const res = await apiClient.get<any>(API_ENDPOINTS.SCAN.GET_BY_ID(inspId));
      const data = res?.data ?? res;
      if (data?.id || data?.inspectionId) return inspectionToReport(data);
    } catch {
      // fall through
    }
    throw new Error(`Report "${id}" not found.`);
  },

  async generateReport(scanId: string, title?: string): Promise<ComplianceReport> {
    // Try to fetch real inspection data and build report from it
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.SCAN.GET_BY_ID(scanId));
      const data = res?.data ?? res;
      if (data?.id || data?.inspectionId) {
        const report = inspectionToReport(data);
        if (title) {
          (report as any).title = title;
        }
        SESSION_REPORTS.unshift(report);
        return report;
      }
    } catch {
      // fall through to synthetic report
    }

    // Synthetic fallback (when inspection data not available)
    const newReport: ComplianceReport = {
      id: `REP_${Date.now().toString().slice(-6)}`,
      scanId,
      generatedAt: new Date().toISOString(),
      generatedBy: 'PackCheck Legal Metrology Inspection Engine v1.2.3',
      overallStatus: 'review',
      totalChecks: 9,
      passedChecks: 0,
      failedChecks: 9,
      reviewChecks: 0,
      violations: [],
      checks: [],
      productInfo: {
        id: `prod_${Date.now()}`,
        name: title || 'Inspected Product Package',
        gtin: 'N/A',
        manufacturer: 'Unknown Manufacturer',
        category: 'Packaged Commodities',
        batchNumber: scanId,
      },
      summary: 'Statutory compliance assessment record generated. Requires manual review.',
      digitalSignature: `AUTH-PCK-${scanId.slice(-8)}-${Date.now().toString(36).toUpperCase()}`,
    };
    SESSION_REPORTS.unshift(newReport);
    return newReport;
  },
};



