"""
Unit tests for orientation.py module
"""

import unittest
import numpy as np
from PIL import Image

from ml.preprocessing.orientation import detect_and_correct_orientation, rotate_image

class TestOrientation(unittest.TestCase):
    def setUp(self):
        self.img_pil = Image.new("RGB", (200, 100), color="green")
        self.img_np = np.zeros((100, 200, 3), dtype=np.uint8)

    def test_no_exif_orientation(self):
        res = detect_and_correct_orientation(self.img_pil, use_exif=True)
        self.assertEqual(res["detected_angle"], 0)
        self.assertFalse(res["applied"])
        self.assertIsNone(res["confidence"])

    def test_rotate_image(self):
        rotated = rotate_image(self.img_np, 90)
        self.assertEqual(rotated.shape[0], 200) # height becomes 200
        self.assertEqual(rotated.shape[1], 100) # width becomes 100

if __name__ == "__main__":
    unittest.main()
