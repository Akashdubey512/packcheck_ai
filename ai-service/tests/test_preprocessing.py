"""
Unit tests for pipeline.py module
"""

import unittest
import numpy as np
from PIL import Image

from ml.preprocessing.pipeline import PreprocessingPipeline

class TestPreprocessingPipeline(unittest.TestCase):
    def setUp(self):
        self.pipeline = PreprocessingPipeline()
        self.test_pil = Image.new("RGB", (300, 300), color=(100, 150, 200))

    def test_pipeline_process_pil(self):
        res = self.pipeline.process(self.test_pil)
        self.assertTrue(res["validation"]["valid"])
        self.assertIsNotNone(res["quality"])
        self.assertIn("ocr_primary", res["variants"])
        self.assertIn("ocr_secondary", res["variants"])
        self.assertGreater(res["execution_time_ms"], 0)

    def test_pipeline_batch_processing(self):
        imgs = [self.test_pil, self.test_pil]
        results = self.pipeline.process_batch(imgs)
        self.assertEqual(len(results), 2)
        self.assertTrue(results[0]["validation"]["valid"])
        self.assertTrue(results[1]["validation"]["valid"])

if __name__ == "__main__":
    unittest.main()
