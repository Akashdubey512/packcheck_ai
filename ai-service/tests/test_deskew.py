"""
Unit tests for deskew.py module
"""

import unittest
import numpy as np
import cv2

from ml.preprocessing.deskew import estimate_and_correct_deskew, estimate_skew_angle_hough

class TestDeskew(unittest.TestCase):
    def setUp(self):
        # Create image with horizontal text lines
        self.flat_img = np.zeros((300, 300), dtype=np.uint8)
        for y in range(50, 250, 30):
            cv2.line(self.flat_img, (20, y), (280, y), 255, 3)

    def test_flat_lines_deskew(self):
        res = estimate_and_correct_deskew(self.flat_img, min_angle=0.5)
        # Should detect ~0 skew and not apply rotation
        self.assertFalse(res["applied"])
        self.assertEqual(res["reason"], "SKEW_BELOW_THRESHOLD")

if __name__ == "__main__":
    unittest.main()
