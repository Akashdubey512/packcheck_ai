"""
Unit Tests for Phase 4 ML Interface Contract Verification
"""

import unittest
from ml.ocr.types import OCRResult, TextRegion, BoundingBox
from ml.extraction.pipeline import ExtractionPipeline


class TestExtractionContract(unittest.TestCase):

    def setUp(self):
        self.pipeline = ExtractionPipeline()

    def test_contract_schema_keys(self):
        ocr = OCRResult(
            image_id="contract_test_01",
            engine="rapidocr",
            engine_version="1.2.3",
            regions=[
                TextRegion(region_id=0, bbox=BoundingBox(10, 10, 100, 40), text="MRP ₹100")
            ]
        )
        facts = self.pipeline.process(ocr)
        d = facts.to_dict()

        required_keys = ["product_id", "status", "fields", "source", "execution_time_ms", "errors"]
        for key in required_keys:
            self.assertIn(key, d)

        # Verify source metadata schema keys
        source_keys = ["ocr_engine", "ocr_version", "preprocessing_version", "extraction_version"]
        for skey in source_keys:
            self.assertIn(skey, d["source"])

        # Verify 9 canonical fields exist in facts.fields
        self.assertEqual(len(d["fields"]), 9)


if __name__ == "__main__":
    unittest.main()
