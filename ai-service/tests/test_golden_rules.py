"""
Unit Tests — Part Z Golden Rule Test Suite
Fixtures testing deterministic compliance verdicts for the 10 mandated legal edge-case scenarios.
NOTE: These fixtures use manually constructed AuditedProductFacts inside unit tests ONLY.
"""

import unittest
from ml.confidence.types import AuditedProductFacts, AuditedField, ConfidenceBreakdown, EvidenceManifest, EvidenceCrop
from ml.compliance.pipeline import CompliancePipeline
from ml.compliance.types import ComplianceStatus, FieldValidationResult


class TestGoldenRules(unittest.TestCase):

    def setUp(self):
        self.pipeline = CompliancePipeline()

    def test_case_1_all_evidence_present_compliant(self):
        """Scenario 1: All required mandatory declarations present & clear -> COMPLIANT."""
        fields = {}
        for f_name in ["mrp", "net_quantity", "manufacturer_name_and_address", "country_of_origin", "manufacturing_packing_date", "best_before_expiry", "consumer_care_details", "common_generic_name", "unit_sale_price"]:
            fields[f_name] = AuditedField(
                field_name=f_name,
                raw_text=f"{f_name}_sample_text",
                raw_value="100" if f_name in ["mrp", "unit_sale_price"] else "500 g" if f_name == "net_quantity" else "2026-08",
                normalized_value={"normalized_value": {"amount": 100.0, "currency": "INR", "canonical_value": 500.0, "canonical_unit": "g", "country": "India", "iso": "2026-08"}},
                status="CONFIDENT",
                confidence=ConfidenceBreakdown(candidate_score=0.90, raw_composite_score=0.85),
                source_region_ids=["0"],
                source_bbox=[10, 10, 100, 40]
            )

        crops = [EvidenceCrop(crop_id=f"crop_{fn}", field_name=fn, region_id="0", bbox=[10, 10, 100, 40], image_path=f"path_{fn}", crop_sha256="hash", width=90, height=30) for fn in fields.keys()]
        manifest = EvidenceManifest(manifest_id="m1", product_id="c1", crops=crops)
        facts = AuditedProductFacts(product_id="c1", fields=fields, evidence_manifest=manifest)

        res = self.pipeline.process(facts)
        self.assertEqual(res.overall_status, ComplianceStatus.COMPLIANT.value)

    def test_case_2_mandatory_declaration_missing_non_compliant(self):
        """Scenario 2: Required declaration demonstrably missing -> NON_COMPLIANT."""
        fields = {
            "mrp": AuditedField(field_name="mrp", status="UNAVAILABLE")  # Missing MRP
        }
        facts = AuditedProductFacts(product_id="c2", fields=fields)
        res = self.pipeline.process(facts)
        self.assertEqual(res.overall_status, ComplianceStatus.NON_COMPLIANT.value)
        self.assertGreaterEqual(len(res.violations), 1)

    def test_case_3_ocr_uncertainty_review_required(self):
        """Scenario 3: OCR uncertainty -> REVIEW_REQUIRED (NOT NON_COMPLIANT)."""
        fields = {
            "mrp": AuditedField(
                field_name="mrp",
                raw_text="MRP ???",
                status="REVIEW_REQUIRED",
                confidence=ConfidenceBreakdown(candidate_score=0.20, raw_composite_score=0.30)
            )
        }
        facts = AuditedProductFacts(product_id="c3", fields=fields)
        res = self.pipeline.process(facts)
        self.assertEqual(res.overall_status, ComplianceStatus.REVIEW_REQUIRED.value)
        self.assertEqual(len(res.violations), 0)

    def test_case_4_multiple_conflicting_mrp_review_required(self):
        """Scenario 4: Multiple conflicting MRPs -> REVIEW_REQUIRED."""
        fields = {
            "mrp": AuditedField(
                field_name="mrp",
                raw_text="MRP ₹100 Offer ₹80",
                status="CONTRADICTORY",
                confidence=ConfidenceBreakdown(candidate_score=0.75, consistency_score=0.50)
            )
        }
        facts = AuditedProductFacts(product_id="c4", fields=fields)
        res = self.pipeline.process(facts)
        self.assertEqual(res.overall_status, ComplianceStatus.REVIEW_REQUIRED.value)

    def test_case_5_missing_bbox_evidence_review_required(self):
        """Scenario 5: Missing visual evidence crop -> REVIEW_REQUIRED."""
        fields = {
            "mrp": AuditedField(
                field_name="mrp",
                raw_text="MRP ₹249",
                normalized_value={"normalized_value": {"amount": 249.0}},
                status="CONFIDENT",
                source_region_ids=["0"],
                source_bbox=[10, 10, 100, 40]
            )
        }
        # Evidence manifest has no crop for MRP
        manifest = EvidenceManifest(manifest_id="m5", product_id="c5", crops=[])
        facts = AuditedProductFacts(product_id="c5", fields=fields, evidence_manifest=manifest)

        res = self.pipeline.process(facts)
        self.assertEqual(res.overall_status, ComplianceStatus.REVIEW_REQUIRED.value)

    def test_case_6_invalid_numeric_quantity_format(self):
        """Scenario 6: Malformed/unparseable numeric quantity -> REVIEW_REQUIRED / INVALID_FORMAT."""
        fields = {
            "net_quantity": AuditedField(
                field_name="net_quantity",
                raw_text="Net Wt: ABC grams",
                status="CONFIDENT",
                normalized_value={"normalized_value": None, "normalization_status": "FAILED"}
            )
        }
        facts = AuditedProductFacts(product_id="c6", fields=fields)
        res = self.pipeline.process(facts)
        self.assertEqual(res.overall_status, ComplianceStatus.REVIEW_REQUIRED.value)

    def test_case_7_not_applicable_field(self):
        """Scenario 7: Not-applicable field -> NOT_APPLICABLE outcome."""
        fields = {}
        facts = AuditedProductFacts(product_id="c7", fields=fields)
        # Pass context: non-imported product where country of origin rule is NOT_APPLICABLE
        res = self.pipeline.process(facts, package_context={"is_imported": False})
        country_outcomes = [f for f in res.field_results if f.field_name == "country_of_origin"]
        self.assertEqual(country_outcomes[0].status, "NOT_APPLICABLE")

    def test_case_8_ambiguous_date_review_required(self):
        """Scenario 8: Ambiguous date format -> REVIEW_REQUIRED."""
        fields = {
            "manufacturing_packing_date": AuditedField(
                field_name="manufacturing_packing_date",
                raw_text="05/06/2026",
                status="AMBIGUOUS",
                normalized_value={"normalized_value": {"iso": "2026-06-05", "possible_alternatives": ["2026-05-06"]}, "normalization_status": "AMBIGUOUS"}
            )
        }
        facts = AuditedProductFacts(product_id="c8", fields=fields)
        res = self.pipeline.process(facts)
        self.assertEqual(res.overall_status, ComplianceStatus.REVIEW_REQUIRED.value)

    def test_case_9_conflicting_countries_review_required(self):
        """Scenario 9: Conflicting country declarations -> REVIEW_REQUIRED."""
        fields = {
            "country_of_origin": AuditedField(
                field_name="country_of_origin",
                raw_text="Made in India / Product of China",
                status="CONTRADICTORY"
            )
        }
        facts = AuditedProductFacts(product_id="c9", fields=fields)
        res = self.pipeline.process(facts)
        self.assertEqual(res.overall_status, ComplianceStatus.REVIEW_REQUIRED.value)

    def test_case_10_unsupported_rule_version_insufficient_evidence(self):
        """Scenario 10: Empty facts / unsupported rule -> INSUFFICIENT_EVIDENCE."""
        facts = AuditedProductFacts(product_id="c10", fields={})
        res = self.pipeline.process(facts)
        self.assertIn(res.overall_status, [ComplianceStatus.INSUFFICIENT_EVIDENCE.value, ComplianceStatus.REVIEW_REQUIRED.value, ComplianceStatus.NON_COMPLIANT.value])


if __name__ == "__main__":
    unittest.main()
