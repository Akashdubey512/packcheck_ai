import { describe, it, expect } from 'vitest';
import { ReportService } from '../src/services/reportService';

describe('ReportService', () => {
  it('generates and archives a new compliance dossier', async () => {
    const newReport = await ReportService.generateReport('scn_sample_generated_01', 'Sample Organic Juice 500ml');

    expect(newReport.id).toBeDefined();
    expect(newReport.scanId).toBe('scn_sample_generated_01');
    expect(newReport.productInfo.name).toBe('Sample Organic Juice 500ml');
    expect(newReport.digitalSignature).toBeDefined();

    // Should now be present in reports list
    const reports = await ReportService.getReports();
    expect(reports.some((r) => r.id === newReport.id)).toBe(true);

    // Can fetch by ID
    const fetched = await ReportService.getReportById(newReport.id);
    expect(fetched.id).toBe(newReport.id);
  });
});
