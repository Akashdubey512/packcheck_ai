"""
Unit Tests for Phase 5 Confidence Pipeline Engine
"""

import unittest
from PIL import Image
from ml.extraction.types import ProductFacts, ExtractedField, FieldStatus, NormalizedValue, NormalizationStatus
from ml.ocr.types import OCRResult, TextRegion, BoundingBox
from ml.confidence.pipeline import ConfidencePipeline
from ml.confidence.types import AuditedProductFacts, ConfidenceStatus


class TestConfidencePipeline(unittest.TestCase):

    def setUp(self):
        self.pipeline = ConfidencePipeline(crop_output_dir="scratch/test_pipeline_crops")
        self.img = Image.new("RGB", (200, 200), color=(255, 255, 255))

    def test_confidence_pipeline_end_to_end(self):
        mrp_field = ExtractedField(
            field_name="mrp",
            raw_text="MRP ₹249.00",
            raw_value="₹249.00",
            normalized_value=NormalizedValue("MRP ₹249.00", {"amount": 249.0, "currency": "INR"}, NormalizationStatus.SUCCESS.value),
            source_region_ids=["0"],
            source_bbox=[10, 10, 100, 40],
            extraction_confidence=0.85,
            status=FieldStatus.EXTRACTED.value
        )
        facts = ProductFacts(product_id="pipeline_sample_01", fields={"mrp": mrp_field})
        ocr = OCRResult(
            image_id="pipeline_sample_01",
            engine="rapidocr",
            engine_version="1.2.3",
            regions=[TextRegion(region_id=0, bbox=BoundingBox(10, 10, 100, 40), text="MRP ₹249.00", confidence=0.95)]
        )

        audited = self.pipeline.process(facts, image_input=self.img, ocr_result=ocr)

        self.assertIsInstance(audited, AuditedProductFacts)
        self.assertEqual(audited.product_id, "pipeline_sample_01")
        self.assertIn("mrp", audited.fields)

        audited_mrp = audited.fields["mrp"]
        self.assertEqual(audited_mrp.status, ConfidenceStatus.CONFIDENT.value)
        self.assertGreaterEqual(audited_mrp.confidence.raw_composite_score, 0.75)
        self.assertEqual(len(audited.provenance.input_sha256), 64)
        self.assertIsNotNone(audited_mrp.explanation)


if __name__ == "__main__":
    unittest.main()
