"""
Unit tests for ocr/pipeline.py module (using mocked backend)
"""

import unittest
from unittest.mock import MagicMock
from PIL import Image

from ml.ocr.pipeline import FullOCRPipeline
from ml.ocr.types import OCRResult, TextRegion, BoundingBox

class TestOCRPipelineMocked(unittest.TestCase):
    def setUp(self):
        self.pipeline = FullOCRPipeline()
        # Mock backend engine
        mock_engine = MagicMock()
        mock_engine.name = "mock_engine"
        mock_engine.version = "1.0.0"
        
        reg1 = TextRegion(region_id=0, bbox=BoundingBox(10, 10, 50, 30), text="MRP", confidence=0.95)
        reg2 = TextRegion(region_id=1, bbox=BoundingBox(55, 10, 100, 30), text="Rs. 50", confidence=0.90)
        
        mock_engine.detect_and_recognize.return_value = OCRResult(
            image_id="MOCK_TEST",
            engine="mock_engine",
            engine_version="1.0.0",
            image_width=200,
            image_height=200,
            status="SUCCESS",
            regions=[reg1, reg2],
            full_raw_text="MRP\nRs. 50"
        )
        self.pipeline.ocr_engine = mock_engine
        self.test_img = Image.new("RGB", (200, 200), color="white")

    def test_pipeline_execution(self):
        res = self.pipeline.process(self.test_img, image_id="MOCK_TEST")
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["engine"], "mock_engine")
        self.assertIn("regions", res)
        self.assertGreater(len(res["regions"]), 0)
        self.assertIn("full_raw_text", res)
        self.assertIn("full_normalized_text", res)

if __name__ == "__main__":
    unittest.main()
