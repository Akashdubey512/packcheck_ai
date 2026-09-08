"""
Unit Tests for Phase 5 Interface Contract Schema Verification
"""

import unittest
from PIL import Image
from ml.extraction.types import ProductFacts, ExtractedField, FieldStatus
from ml.confidence.pipeline import ConfidencePipeline


class TestConfidenceContract(unittest.TestCase):

    def setUp(self):
        self.pipeline = ConfidencePipeline(crop_output_dir="scratch/test_contract_crops")

    def test_audited_product_facts_contract_schema(self):
        mrp_field = ExtractedField(
            field_name="mrp",
            raw_text="MRP ₹100",
            raw_value="₹100",
            source_region_ids=["0"],
            source_bbox=[5, 5, 80, 25],
            status=FieldStatus.EXTRACTED.value
        )
        facts = ProductFacts(product_id="contract_sample_01", fields={"mrp": mrp_field})
        audited = self.pipeline.process(facts)
        d = audited.to_dict()

        required_top_keys = ["product_id", "status", "fields", "evidence_manifest", "provenance", "execution_time_ms", "errors"]
        for key in required_top_keys:
            self.assertIn(key, d)

        # Check provenance keys
        prov_keys = ["input_sha256", "dataset_version", "preprocessing_version", "ocr_engine", "ocr_version", "extraction_version", "confidence_version"]
        for pkey in prov_keys:
            self.assertIn(pkey, d["provenance"])

        # Check field keys
        field_keys = ["field_name", "raw_text", "raw_value", "normalized_value", "status", "confidence", "evidence_crop_ids", "source_region_ids", "source_bbox", "explanation"]
        for fkey in field_keys:
            self.assertIn(fkey, d["fields"]["mrp"])


if __name__ == "__main__":
    unittest.main()
