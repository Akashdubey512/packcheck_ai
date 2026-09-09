import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isDemoMode } from '@/app/config/env';
import { ComplianceCheck, Violation } from '@/types/compliance';
import { DecisionTrace } from '@/types/evidence';

export interface ComplianceCheckResult {
  scanId: string;
  overallStatus: 'compliant' | 'violation' | 'review' | 'info';
  score: number;
  checks: ComplianceCheck[];
  violations: Violation[];
}

export const ComplianceService = {
  async getComplianceCheck(scanId: string): Promise<ComplianceCheckResult> {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (scanId === 'invalid' || scanId === 'not_found' || scanId.startsWith('scn_invalid')) {
        throw new Error(`Compliance assessment record not found for "${scanId}".`);
      }

      // Compliant Dairy Case
      if (scanId.includes('dairy')) {
        return {
          scanId,
          overallStatus: 'compliant',
          score: 98.5,
          checks: [
            {
              id: 'chk_d_01',
              ruleId: 'LM_RULE_6_NET_QTY',
              ruleName: 'Mandatory Declaration of Net Quantity',
              ruleCategory: 'packaging',
              status: 'compliant',
              severity: 'high',
              message: 'Net quantity conforms to metric standards and minimum numeral height (1000ml / 1.0L).',
              legalReference: 'Legal Metrology (Packaged Commodities) Rules 2011, Rule 6(1)(e)',
              confidenceScore: 0.99,
              decisionTraceId: 'trc_d_01',
              fieldReference: 'netWeight',
            },
            {
              id: 'chk_d_02',
              ruleId: 'FSSAI_REG_2_LIC',
              ruleName: 'FSSAI Central License Display & Validation',
              ruleCategory: 'statutory',
              status: 'compliant',
              severity: 'critical',
              message: '14-digit FSSAI license validated with national food registry.',
              legalReference: 'FSSAI Packaging and Labelling Regulations 2011, Clause 2.2.1:7',
              confidenceScore: 0.98,
              decisionTraceId: 'trc_d_02',
              fieldReference: 'licenseNumber',
            },
            {
              id: 'chk_d_03',
              ruleId: 'FSSAI_USE_BY_DATE',
              ruleName: 'Perishable Use By Date Declaration',
              ruleCategory: 'statutory',
              status: 'compliant',
              severity: 'critical',
              message: 'Explicit Use By Date and hourly packaging stamp correctly formatted.',
              legalReference: 'FSSAI Food Safety & Standards Regulations, Clause 2.2.2:4',
              confidenceScore: 0.99,
              decisionTraceId: 'trc_d_03',
              fieldReference: 'expiryDate',
            },
          ],
          violations: [],
        };
      }

      // Default: Cereal Sample with Infractions (Violations detected)
      const violations: Violation[] = [
        {
          id: 'viol_01',
          ruleId: 'LM_SEC_6_1_D_EXP',
          title: 'Mandatory Expiry / Best Before Declaration Omitted',
          description:
            'The packaging label fails to declare a Best Before or Expiry Date. Under national consumer protection laws, shelf-stable fortified food commodities must declare either a calendar date or period from manufacture.',
          severity: 'critical',
          status: 'violation',
          boundingBox: { x: 51.25, y: 76, width: 40, height: 10 },
          legalClause:
            'Legal Metrology (Packaged Commodities) Rules 2011, Rule 6(1)(d) & FSSAI Packaging and Labelling Reg. Clause 2.2.2:4',
          recommendedAction:
            'Impose statutory quarantine on batch LOT-2026-X89. Issue non-compliance citation to manufacturer requiring corrective packaging re-run.',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'viol_02',
          ruleId: 'LM_SEC_7_1_FONT_SIZE',
          title: 'Net Quantity Numeral Height Below Statutory 4.0mm Minimum',
          description:
            'The optical character inspection measured numeral print height of 1.8mm for net weight declaration. Statutory Table 1 prescribes a minimum numeral height of 4.0mm for net quantities exceeding 200g up to 500g.',
          severity: 'high',
          status: 'violation',
          boundingBox: { x: 8.75, y: 67, width: 40, height: 7 },
          legalClause:
            'Legal Metrology (Packaged Commodities) Rules 2011, Rule 7(1), Table 1 (Minimum height of numerals)',
          recommendedAction:
            'Enforce mandatory typography plate revision on packaging artwork to expand numeral size to >= 4.0mm.',
          timestamp: new Date().toISOString(),
        },
      ];

      const checks: ComplianceCheck[] = [
        {
          id: 'chk_cereal_exp',
          ruleId: 'LM_SEC_6_1_D_EXP',
          ruleName: 'Mandatory Expiry / Best Before Date Declaration',
          ruleCategory: 'statutory',
          status: 'violation',
          severity: 'critical',
          message: 'FAILED: Statutory field missing from packaging imprint.',
          legalReference: 'Legal Metrology Rules, Rule 6(1)(d)',
          confidenceScore: 0.35,
          decisionTraceId: 'trc_exp_01',
          fieldReference: 'expiryDate',
        },
        {
          id: 'chk_cereal_net',
          ruleId: 'LM_SEC_7_1_FONT_SIZE',
          ruleName: 'Net Quantity Declaration Font Size Metric',
          ruleCategory: 'packaging',
          status: 'violation',
          severity: 'high',
          message: 'FAILED: Numeral height measured 1.8mm (Minimum required: 4.0mm).',
          legalReference: 'Legal Metrology Rules, Rule 7(1), Table 1',
          confidenceScore: 0.97,
          decisionTraceId: 'trc_net_01',
          fieldReference: 'netWeight',
        },
        {
          id: 'chk_cereal_allergen',
          ruleId: 'FSSAI_REG_5_3_ALLERGEN',
          ruleName: 'Statutory Allergen Advisory Contrast & Legibility',
          ruleCategory: 'labeling',
          status: 'review',
          severity: 'medium',
          message: 'REVIEW: Allergen text detected; contrast ratio 3.8:1 is borderline against background tint.',
          legalReference: 'FSSAI (Labelling & Display) Regulations 2020, Reg. 5(3)(b)',
          confidenceScore: 0.88,
          decisionTraceId: 'trc_alg_01',
          fieldReference: 'allergenDeclaration',
        },
        {
          id: 'chk_cereal_lic',
          ruleId: 'FSSAI_REG_2_LIC',
          ruleName: 'FSSAI 14-Digit License Display & Registry Crosscheck',
          ruleCategory: 'statutory',
          status: 'compliant',
          severity: 'critical',
          message: 'PASSED: 14-digit license number 10012011000189 valid in national database.',
          legalReference: 'FSSAI Packaging and Labelling Regulations, Clause 2.2.1:7',
          confidenceScore: 0.96,
          decisionTraceId: 'trc_lic_01',
          fieldReference: 'licenseNumber',
        },
        {
          id: 'chk_cereal_mfg',
          ruleId: 'LM_SEC_6_MFG_DATE',
          ruleName: 'Month & Year of Manufacture Declaration',
          ruleCategory: 'statutory',
          status: 'compliant',
          severity: 'high',
          message: 'PASSED: Date of manufacture (15/06/2026) prominently displayed.',
          legalReference: 'Legal Metrology Rules, Rule 6(1)(d)',
          confidenceScore: 0.95,
          decisionTraceId: 'trc_mfg_01',
          fieldReference: 'mfgDate',
        },
        {
          id: 'chk_cereal_veg',
          ruleId: 'FSSAI_REG_VEG_LOGO',
          ruleName: 'Vegetarian Dietary Emblem Declaration',
          ruleCategory: 'origin',
          status: 'compliant',
          severity: 'high',
          message: 'PASSED: Statutory green circle in green square present on principal display panel.',
          legalReference: 'FSSAI Food Safety and Standards Regulations, Clause 2.2.2:4',
          confidenceScore: 0.99,
          decisionTraceId: 'trc_veg_01',
          fieldReference: 'vegEmblem',
        },
      ];

      return {
        scanId,
        overallStatus: 'violation',
        score: 68.5,
        checks,
        violations,
      };
    }

    // Try dedicated compliance endpoint first; fall back to extracting from inspection record
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.COMPLIANCE.CHECK(scanId));
      const data = res.data || res;
      return this.normalizeComplianceResult(scanId, data);
    } catch {
      // Compliance endpoint not available — extract from inspection record
      try {
        const res = await apiClient.get<any>(API_ENDPOINTS.SCAN.GET_BY_ID(scanId));
        const data = res.data || res;
        return this.normalizeComplianceResult(scanId, data);
      } catch {
        // Last resort: return a minimal valid compliance result
        return {
          scanId,
          overallStatus: 'review',
          score: 0,
          checks: [],
          violations: [],
        };
      }
    }
  },

  normalizeComplianceResult(scanId: string, data: any): ComplianceCheckResult {
    const result = data.result || data;
    const rawViolations = Array.isArray(result.violations) ? result.violations : [];
    const rawChecks = Array.isArray(result.checks)
      ? result.checks
      : Array.isArray(result.rules)
      ? result.rules
      : [];

    const violations: Violation[] = rawViolations.map((v: any, idx: number) => ({
      id: v.id || `viol_${idx}`,
      ruleId: v.ruleId || v.rule || `rule_${idx}`,
      title: v.title || v.rule || v.description || 'Compliance Violation Detected',
      description: v.description || v.message || 'A statutory violation was detected.',
      severity: v.severity || 'high',
      status: 'violation' as const,
      boundingBox: v.boundingBox || v.bbox,
      legalClause: v.legalClause || v.reference || '',
      recommendedAction: v.recommendedAction || v.recommendation || '',
      timestamp: v.timestamp || new Date().toISOString(),
    }));

    const checks: ComplianceCheck[] = rawChecks.map((c: any, idx: number) => {
      const s = (c.status || '').toString().toLowerCase();
      const isCompliant = s === 'pass' || s === 'compliant' || c.passed === true;
      const isViolation = s === 'fail' || s === 'violation' || s === 'missing' || s === 'invalid_format' || s === 'invalid_value' || c.passed === false;

      return {
        id: c.id || `chk_${idx}`,
        ruleId: c.ruleId || c.rule || `rule_${idx}`,
        ruleName: c.ruleName || c.name || c.rule || 'Compliance Check',
        ruleCategory: c.ruleCategory || c.category || 'statutory',
        status: isCompliant ? 'compliant' : isViolation ? 'violation' : 'review',
        severity: c.severity || 'medium',
        message: c.message || c.detail || '',
        legalReference: c.legalReference || c.reference || '',
        confidenceScore: c.confidenceScore ?? c.confidence ?? 1,
        decisionTraceId: c.decisionTraceId || c.traceId,
        fieldReference: c.fieldReference || c.field,
      };
    });

    const score = (() => {
      // Prioritize computing directly from checks (guarantees consistency with displayed checklist)
      if (checks.length > 0) {
        const compliantCount = checks.filter((c) => c.status === 'compliant').length;
        return Math.round((compliantCount / checks.length) * 100);
      }
      // Fallback: derive from violations count
      if (violations.length > 0) return Math.max(0, 100 - violations.length * 12);
      if (typeof result.score === 'number') return result.score;
      if (typeof data.score === 'number') return data.score;
      return typeof data.overallScore === 'number' ? data.overallScore : 100;
    })();

    // Derive violations from checks that failed, if violations list is empty
    const effectiveViolations: typeof violations = violations.length > 0
      ? violations
      : checks
          .filter((c) => c.status === 'violation')
          .map((c) => ({
            id: `viol_${c.id}`,
            ruleId: c.ruleId,
            title: c.ruleName,
            description: c.message || `Mandatory statutory declaration non-compliant: ${c.ruleName}`,
            severity: c.severity as 'critical' | 'high' | 'medium' | 'low',
            status: 'violation' as const,
            legalClause: c.legalReference,
            recommendedAction: 'Rectify the packaging to include the mandatory statutory declaration.',
            timestamp: new Date().toISOString(),
          }));

    const hasViolations = effectiveViolations.length > 0 || checks.some((c) => c.status === 'violation');
    const overallStatus: ComplianceCheckResult['overallStatus'] =
      hasViolations ? 'violation'
      : checks.some((c) => c.status === 'review') ? 'review'
      : 'compliant';

    return { scanId, overallStatus, score, checks, violations: effectiveViolations };
  },

  async getDecisionTrace(traceId: string): Promise<DecisionTrace> {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (traceId === 'trc_exp_01') {
        return {
          id: traceId,
          scanId: 'scn_sample_cereal',
          ruleId: 'LM_SEC_6_1_D_EXP',
          ruleName: 'Mandatory Expiry / Best Before Date Declaration',
          evaluatedConditions: [
            {
              condition: 'Presence of statutory keywords: "EXPIRY", "EXP", "USE BY", or "BEST BEFORE"',
              expected: true,
              actual: false,
              passed: false,
            },
            {
              condition: 'Presence of valid calendar date (DD/MM/YYYY or MM/YYYY)',
              expected: true,
              actual: 'NONE_FOUND',
              passed: false,
            },
            {
              condition: 'Optical extraction confidence for date field >= 0.80',
              expected: '>= 0.80',
              actual: '0.35',
              passed: false,
            },
          ],
          inputs: {
            extractedTextSnippet: '[ FIELD BLANK / MISSING FROM PRINT ]',
            boundingCoordinates: { x: 51.25, y: 76, width: 40, height: 10 },
            declaredShelfLife: 'Not declared',
          },
          outputVerdict: 'FAIL',
          timestamp: new Date().toISOString(),
          executionEngineVersion: 'v2.4.1-regulatory-engine',
          auditHash: '38a19b8401ef982c7104b281f9a842b109e451b67e0a92b8d91c28fa47b1980a',
        };
      }

      if (traceId === 'trc_net_01') {
        return {
          id: traceId,
          scanId: 'scn_sample_cereal',
          ruleId: 'LM_SEC_7_1_FONT_SIZE',
          ruleName: 'Net Quantity Numeral Height Metric',
          evaluatedConditions: [
            {
              condition: 'Declared Net Weight value syntax matches SI unit regex',
              expected: '500g',
              actual: '500g',
              passed: true,
            },
            {
              condition: 'Numeral height measurement for commodity > 200g up to 500g',
              expected: '>= 4.0mm',
              actual: '1.8mm',
              passed: false,
            },
            {
              condition: 'Area of Principal Display Panel proportionality factor',
              expected: '>= 1.5%',
              actual: '0.7%',
              passed: false,
            },
          ],
          inputs: {
            rawValue: 'NET WEIGHT: 500g (17.63 oz)',
            measuredNumeralHeightMm: 1.8,
            statutoryRequiredHeightMm: 4.0,
            measuredUnit: 'g',
          },
          outputVerdict: 'FAIL',
          timestamp: new Date().toISOString(),
          executionEngineVersion: 'v2.4.1-regulatory-engine',
          auditHash: '72fa189c2049b817e0129a8f4c1920b784912ab091ef781a98214fa8120b4112',
        };
      }

      if (traceId === 'trc_alg_01') {
        return {
          id: traceId,
          scanId: 'scn_sample_cereal',
          ruleId: 'FSSAI_REG_5_3_ALLERGEN',
          ruleName: 'Allergen Advisory Contrast & Legibility',
          evaluatedConditions: [
            {
              condition: 'Allergen declaration bold font formatting',
              expected: true,
              actual: true,
              passed: true,
            },
            {
              condition: 'Contrast ratio between text and background >= 4.5:1',
              expected: '>= 4.5:1',
              actual: '3.8:1',
              passed: false,
            },
          ],
          inputs: {
            extractedText: 'CONTAINS WHEAT, BARLEY & SOY',
            measuredContrastRatio: '3.8:1',
            textColorHex: '#92400e',
            bgColorHex: '#fef3c7',
          },
          outputVerdict: 'FLAG',
          timestamp: new Date().toISOString(),
          executionEngineVersion: 'v2.4.1-regulatory-engine',
          auditHash: '99bf21a084c8192837190f84a8b7190248a192840b719284102948a19284b120',
        };
      }

      // Fallback trace
      return {
        id: traceId,
        scanId: 'scn_sample_cereal',
        ruleId: 'FSSAI_REG_2_LIC',
        ruleName: 'Statutory License Verification',
        evaluatedConditions: [
          {
            condition: 'Field length equals exactly 14 digits',
            expected: 14,
            actual: 14,
            passed: true,
          },
          {
            condition: 'Issuer state code prefix matches national state code directory',
            expected: '100 (State Authority)',
            actual: '100 (State Authority)',
            passed: true,
          },
        ],
        inputs: { licenseNumber: '10012011000189' },
        outputVerdict: 'PASS',
        timestamp: new Date().toISOString(),
        executionEngineVersion: 'v2.4.1-regulatory-engine',
        auditHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      };
    }

    return apiClient.get<DecisionTrace>(API_ENDPOINTS.COMPLIANCE.DECISION_TRACE(traceId));
  },

  async certifyInspection(scanId: string, role?: string, userId?: string): Promise<any> {
    const token = localStorage.getItem('token') || '';
    const res = await fetch(`http://localhost:5000/api/v1/inspections/${scanId}/certify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(role ? { 'X-User-Role': role } : {}),
        ...(userId ? { 'X-User-Id': userId } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ note: 'Statutory packaging declarations verified compliant by Legal Metrology Officer.' }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Certification failed: ${res.statusText}`);
    }
    return await res.json();
  },
};

