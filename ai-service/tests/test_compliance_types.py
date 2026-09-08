"""
Unit Tests for Phase 6 Legal Metrology Compliance Types and Schemas
"""

import unittest
from ml.compliance.types import (
    ComplianceStatus, FieldValidationResult, ApplicabilityState,
    CANONICAL_COMPLIANCE_FIELDS, FIELD_ALIAS_MAP, normalize_compliance_field_name,
    FieldRuleOutcome, ViolationItem, ReviewItem, ComplianceProvenance, ComplianceResult
)


class TestComplianceTypes(unittest.TestCase):

    def test_compliance_statuses(self):
        self.assertEqual(ComplianceStatus.COMPLIANT.value, "COMPLIANT")
        self.assertEqual(ComplianceStatus.NON_COMPLIANT.value, "NON_COMPLIANT")
        self.assertEqual(ComplianceStatus.REVIEW_REQUIRED.value, "REVIEW_REQUIRED")
        self.assertEqual(ComplianceStatus.INSUFFICIENT_EVIDENCE.value, "INSUFFICIENT_EVIDENCE")

    def test_field_validation_results(self):
        self.assertEqual(FieldValidationResult.PASS.value, "PASS")
        self.assertEqual(FieldValidationResult.FAIL.value, "FAIL")
        self.assertEqual(FieldValidationResult.MULTIPLE_CANDIDATES.value, "MULTIPLE_CANDIDATES")
        self.assertEqual(FieldValidationResult.AMBIGUOUS.value, "AMBIGUOUS")

    def test_field_alias_normalization(self):
        self.assertEqual(normalize_compliance_field_name("mrp"), "mrp_inclusive_of_taxes")
        self.assertEqual(normalize_compliance_field_name("manufacturer_name_and_address"), "manufacturer_name_address")
        self.assertEqual(normalize_compliance_field_name("manufacturing_packing_date"), "manufacture_or_packing_date")

    def test_compliance_result_serialization(self):
        outcome = FieldRuleOutcome(
            rule_id="RULE_6_1_G",
            field_name="mrp_inclusive_of_taxes",
            status=FieldValidationResult.PASS.value,
            reason_code="MRP_VALID",
            explanation="MRP ₹ 249.00 valid"
        )
        res = ComplianceResult(
            product_id="sample_01",
            overall_status=ComplianceStatus.COMPLIANT.value,
            field_results=[outcome]
        )
        d = res.to_dict()
        self.assertEqual(d["product_id"], "sample_01")
        self.assertEqual(d["overall_status"], "COMPLIANT")
        self.assertEqual(d["field_results"][0]["rule_id"], "RULE_6_1_G")


if __name__ == "__main__":
    unittest.main()
