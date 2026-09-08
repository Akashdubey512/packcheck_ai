"""
Unit Tests for Phase 4 Extraction Pipeline Engine
"""

import unittest
from ml.ocr.types import OCRResult, TextRegion, BoundingBox
from ml.extraction.pipeline import ExtractionPipeline
from ml.extraction.types import ProductFacts, FieldStatus


class TestExtractionPipeline(unittest.TestCase):

    def setUp(self):
        self.pipeline = ExtractionPipeline()

    def test_full_extraction_pipeline(self):
        ocr = OCRResult(
            image_id="test_pack_001",
            engine="rapidocr",
            engine_version="1.2.3",
            regions=[
                TextRegion(region_id=0, bbox=BoundingBox(10, 10, 150, 40), text="Mfd by: Acme Foods Pvt Ltd, Delhi"),
                TextRegion(region_id=1, bbox=BoundingBox(10, 50, 120, 80), text="MRP ₹249.00 (Incl. of all taxes)"),
                TextRegion(region_id=2, bbox=BoundingBox(10, 90, 100, 120), text="Net Wt: 500 g"),
                TextRegion(region_id=3, bbox=BoundingBox(10, 130, 110, 160), text="Mfg Date: 08/2026"),
                TextRegion(region_id=4, bbox=BoundingBox(10, 170, 120, 200), text="Country of Origin: India"),
                TextRegion(region_id=5, bbox=BoundingBox(10, 210, 180, 240), text="Care: 1800-123-4567 email: support@acme.com")
            ]
        )
        facts = self.pipeline.process(ocr)

        self.assertIsInstance(facts, ProductFacts)
        self.assertEqual(facts.product_id, "test_pack_001")
        self.assertEqual(facts.status, "SUCCESS")

        # Verify extracted fields
        fields = facts.fields
        self.assertIn("mrp", fields)
        self.assertIn(fields["mrp"].status, [FieldStatus.EXTRACTED.value, FieldStatus.MULTIPLE_CANDIDATES.value])
        self.assertEqual(fields["mrp"].normalized_value.normalized_value["amount"], 249.0)

        self.assertIn("net_quantity", fields)
        self.assertEqual(fields["net_quantity"].normalized_value.normalized_value["canonical_value"], 500.0)

        self.assertIn("country_of_origin", fields)
        self.assertEqual(fields["country_of_origin"].normalized_value.normalized_value["country"], "India")

    def test_pipeline_dict_input(self):
        dict_ocr = {
            "image_id": "test_dict_01",
            "engine": "rapidocr",
            "engine_version": "1.2.3",
            "regions": [
                {"region_id": 0, "bbox": [0, 0, 100, 20], "text": "Net Vol 250 ml"}
            ]
        }
        facts = self.pipeline.process(dict_ocr)
        self.assertEqual(facts.product_id, "test_dict_01")
        self.assertEqual(facts.fields["net_quantity"].normalized_value.normalized_value["canonical_value"], 250.0)


if __name__ == "__main__":
    unittest.main()
