"""
Unit tests for quality.py module
"""

import unittest
import numpy as np
import cv2
from PIL import Image

from ml.preprocessing.quality import assess_image_quality

class TestImageQuality(unittest.TestCase):
    def setUp(self):
        # Create sharp, clear image
        img_arr = np.zeros((200, 200, 3), dtype=np.uint8)
        cv2.rectangle(img_arr, (50, 50), (150, 150), (255, 255, 255), -1)
        self.sharp_img = Image.fromarray(img_arr)

        # Create blurry image via heavy Gaussian Blur
        blurry_arr = cv2.GaussianBlur(img_arr, (31, 31), 10.0)
        self.blurry_img = Image.fromarray(blurry_arr)

        # Create dark image
        dark_arr = np.ones((200, 200, 3), dtype=np.uint8) * 15
        self.dark_img = Image.fromarray(dark_arr)

    def test_sharp_image_assessment(self):
        res = assess_image_quality(self.sharp_img)
        self.assertIn(res["status"], ["GOOD", "ACCEPTABLE"])
        self.assertGreater(res["metrics"]["blur_score_laplacian"], 100.0)

    def test_blurry_image_assessment(self):
        res = assess_image_quality(self.blurry_img, blur_threshold=100.0)
        self.assertLess(res["metrics"]["blur_score_laplacian"], 100.0)
        self.assertTrue(any("blurry" in w.lower() for w in res["warnings"]))

    def test_dark_image_assessment(self):
        res = assess_image_quality(self.dark_img, brightness_min=40.0)
        self.assertLess(res["metrics"]["brightness"], 40.0)
        self.assertTrue(any("dark" in w.lower() for w in res["warnings"]))

if __name__ == "__main__":
    unittest.main()
