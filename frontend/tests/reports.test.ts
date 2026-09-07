import { describe, it, expect } from 'vitest';
import { ReportService } from '../src/services/reportService';

describe('ReportService', () => {
  it('retrieves the catalog of statutory compliance inspection reports', async () => {
    const reports = await ReportService.getReports();

    expect(reports.length).toBeGreaterThanOrEqual(3);
    expect(reports[0]!.digitalSignature).toBeDefined();
    expect(reports[0]!.productInfo.name).toBeDefined();
  });

  it('fetches an individual compliant report by ID', async () => {
    const report = await ReportService.getReportById('rep_2026_001');

    expect(report.id).toBe('rep_2026_001');
    expect(report.overallStatus).toBe('compliant');
    expect(report.failedChecks).toBe(0);
    expect(report.productInfo.batchNumber).toBe('MLK-882-A');
  });

  it('fetches an individual violation report with critical citations', async () => {
    const report = await ReportService.getReportById('rep_2026_002');

    expect(report.id).toBe('rep_2026_002');
    expect(report.overallStatus).toBe('violation');
    expect(report.violations.length).toBeGreaterThanOrEqual(2);
    expect(report.violations[0]!.legalClause).toContain('Legal Metrology Rules 2011');
  });

  it('generates and archives a new signed compliance dossier', async () => {
    const newReport = await ReportService.generateReport('scn_sample_generated_01', 'Sample Organic Juice 500ml');

    expect(newReport.id).toBeDefined();
    expect(newReport.scanId).toBe('scn_sample_generated_01');
    expect(newReport.productInfo.name).toBe('Sample Organic Juice 500ml');
    expect(newReport.digitalSignature).toContain('SIG-RSA4096-');

    // Should now be present in reports list
    const reports = await ReportService.getReports();
    expect(reports.some((r) => r.id === newReport.id)).toBe(true);
  });
});
