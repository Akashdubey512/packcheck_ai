"""
Unit Tests for Phase 6 Compliance Pipeline Engine
"""

import unittest
from ml.confidence.types import AuditedProductFacts, AuditedField, ConfidenceBreakdown, EvidenceManifest, EvidenceCrop
from ml.compliance.pipeline import CompliancePipeline
from ml.compliance.types import ComplianceResult, ComplianceStatus


class TestCompliancePipeline(unittest.TestCase):

    def setUp(self):
        self.pipeline = CompliancePipeline()

    def test_end_to_end_compliance_pipeline(self):
        mrp_field = AuditedField(
            field_name="mrp",
            raw_text="MRP ₹249.00",
            raw_value="₹249.00",
            normalized_value={"raw_text": "MRP ₹249.00", "normalized_value": {"amount": 249.0, "currency": "INR"}, "normalization_status": "SUCCESS"},
            status="CONFIDENT",
            confidence=ConfidenceBreakdown(candidate_score=0.85, raw_composite_score=0.88),
            source_region_ids=["0"],
            source_bbox=[10, 10, 100, 40]
        )
        facts = AuditedProductFacts(
            product_id="sample_pipeline_01",
            fields={"mrp": mrp_field},
            evidence_manifest=EvidenceManifest(
                manifest_id="m1", product_id="sample_pipeline_01",
                crops=[EvidenceCrop(crop_id="crop_mrp", field_name="mrp", region_id="0", bbox=[10, 10, 100, 40], image_path="p", crop_sha256="h", width=90, height=30)]
            )
        )

        res = self.pipeline.process(facts)
        self.assertIsInstance(res, ComplianceResult)
        self.assertEqual(res.product_id, "sample_pipeline_01")
        self.assertEqual(res.rule_version, "2022.1")
        self.assertGreaterEqual(len(res.field_results), 1)
        self.assertIsNotNone(res.provenance)


if __name__ == "__main__":
    unittest.main()
