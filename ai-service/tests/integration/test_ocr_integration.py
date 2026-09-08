"""
Real OCR Integration Smoke Test
Runs actual OCR backend engine on representative sample images from processed_data/.
Verifies schema compliance, bounding box validity, and confidence score behavior.
"""

import unittest
from pathlib import Path
from PIL import Image

from ml.ocr.pipeline import FullOCRPipeline

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_TRAIN_DIR = BASE_DIR / "processed_data" / "train" / "images"

class TestOCRIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            cls.pipeline = FullOCRPipeline(backend_name="rapidocr")
            cls.engine_available = True
        except Exception as e:
            cls.engine_available = False
            cls.init_error = str(e)

    def test_real_image_ocr(self):
        if not self.engine_available:
            self.skipTest(f"OCR Engine not available for integration test: {getattr(self, 'init_error', '')}")

        if not PROCESSED_TRAIN_DIR.exists():
            self.skipTest("Processed train image directory not found.")

        img_files = list(PROCESSED_TRAIN_DIR.glob("*.jpg")) + list(PROCESSED_TRAIN_DIR.glob("*.png"))
        if not img_files:
            self.skipTest("No image files found in processed train directory.")

        sample_path = img_files[0]
        res = self.pipeline.process(sample_path)

        # Schema Verification
        self.assertEqual(res["image_id"], sample_path.stem)
        self.assertIn(res["status"], ["SUCCESS", "NO_TEXT", "PARTIAL", "FAILED"])
        self.assertIn("regions", res)
        self.assertIn("full_raw_text", res)
        self.assertIn("full_normalized_text", res)

        # Region Bounding Box & Confidence Checks
        for reg in res["regions"]:
            bbox = reg["bbox"]
            self.assertEqual(len(bbox), 4)
            self.assertGreaterEqual(bbox[2], bbox[0]) # x2 >= x1
            self.assertGreaterEqual(bbox[3], bbox[1]) # y2 >= y1
            if reg["confidence"] is not None:
                self.assertGreaterEqual(reg["confidence"], 0.0)
                self.assertLessEqual(reg["confidence"], 1.0)

if __name__ == "__main__":
    unittest.main()
