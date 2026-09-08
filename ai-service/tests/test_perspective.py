"""
Unit tests for perspective.py module
"""

import unittest
import numpy as np

from ml.preprocessing.perspective import analyze_and_correct_perspective, warp_perspective_four_point

class TestPerspective(unittest.TestCase):
    def setUp(self):
        self.img_np = np.zeros((300, 300, 3), dtype=np.uint8)

    def test_no_boundary_returns_false(self):
        res = analyze_and_correct_perspective(self.img_np, corners=None)
        self.assertFalse(res["applied"])
        self.assertEqual(res["reason"], "NO_RELIABLE_BOUNDARY")

    def test_four_corners_rectification(self):
        corners = [(10.0, 10.0), (290.0, 20.0), (280.0, 290.0), (20.0, 280.0)]
        res = analyze_and_correct_perspective(self.img_np, corners=corners)
        self.assertTrue(res["applied"])
        self.assertEqual(res["reason"], "PERSPECTIVE_RECTIFIED")

if __name__ == "__main__":
    unittest.main()
