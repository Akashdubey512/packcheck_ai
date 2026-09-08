"""
Unit Tests for Phase 6 Interface Contract Schema Verification
"""

import unittest
from ml.confidence.types import AuditedProductFacts, AuditedField
from ml.compliance.pipeline import CompliancePipeline


class TestComplianceContract(unittest.TestCase):

    def setUp(self):
        self.pipeline = CompliancePipeline()

    def test_compliance_result_contract_keys(self):
        mrp_field = AuditedField(field_name="mrp", raw_text="MRP ₹100", status="CONFIDENT")
        facts = AuditedProductFacts(product_id="contract_test_01", fields={"mrp": mrp_field})
        res = self.pipeline.process(facts)
        d = res.to_dict()

        required_keys = [
            "product_id", "overall_status", "rule_version", "evaluated_at",
            "rules_evaluated", "field_results", "violations", "review_items",
            "evidence", "explanations", "provenance", "execution_time_ms", "errors"
        ]
        for key in required_keys:
            self.assertIn(key, d)

        prov_keys = [
            "input_sha256", "dataset_version", "preprocessing_version", "ocr_engine",
            "ocr_version", "extraction_version", "confidence_version", "compliance_engine_version",
            "rule_registry_version", "evaluated_at", "rule_ids_used"
        ]
        for pkey in prov_keys:
            self.assertIn(pkey, d["provenance"])


if __name__ == "__main__":
    unittest.main()
