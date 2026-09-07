import { describe, it, expect } from 'vitest';
import { ComplianceService } from '../src/services/complianceService';

describe('ComplianceService & Decision Trace', () => {
  it('should return violation checks for the cereal sample with infractions', async () => {
    const result = await ComplianceService.getComplianceCheck('scn_sample_cereal');

    expect(result.overallStatus).toBe('violation');
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
    expect(result.checks.some((c) => c.status === 'violation')).toBe(true);

    const expViolation = result.violations.find((v) => v.id === 'viol_01');
    expect(expViolation).toBeDefined();
    expect(expViolation?.severity).toBe('critical');
  });

  it('should return 100% compliant checks for the dairy sample', async () => {
    const result = await ComplianceService.getComplianceCheck('scn_sample_dairy');

    expect(result.overallStatus).toBe('compliant');
    expect(result.violations.length).toBe(0);
    expect(result.score).toBeGreaterThan(95);
  });

  it('should retrieve a deterministic decision trace with evaluated conditions', async () => {
    const trace = await ComplianceService.getDecisionTrace('trc_exp_01');

    expect(trace.id).toBe('trc_exp_01');
    expect(trace.ruleId).toBe('LM_SEC_6_1_D_EXP');
    expect(trace.outputVerdict).toBe('FAIL');
    expect(trace.evaluatedConditions.length).toBeGreaterThan(0);
    expect(trace.auditHash).toBeDefined();
  });
});
