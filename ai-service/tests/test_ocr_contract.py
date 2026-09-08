"""
Unit tests for ML_CONTRACT.md schema compliance
"""

import unittest
from ml.ocr.types import OCRResult, TextRegion, BoundingBox

class TestOCRContract(unittest.TestCase):
    def test_contract_keys(self):
        res = OCRResult(
            image_id="CONTRACT_TEST",
            engine="rapidocr",
            engine_version="1.2.3",
            image_width=640,
            image_height=480,
            status="SUCCESS"
        )
        d = res.to_dict()
        
        required_keys = [
            "image_id", "ocr_version", "engine", "engine_version",
            "preprocessing_version", "dataset_version", "image",
            "status", "regions", "full_raw_text", "full_normalized_text",
            "errors", "execution_time_ms"
        ]
        
        for k in required_keys:
            self.assertIn(k, d)

        self.assertIn("width", d["image"])
        self.assertIn("height", d["image"])

if __name__ == "__main__":
    unittest.main()
