"""
Unit tests for ocr/region_merger.py module
"""

import unittest
from ml.ocr.types import TextRegion, BoundingBox
from ml.ocr.region_merger import merge_nearby_regions, is_same_line

class TestRegionMerger(unittest.TestCase):
    def setUp(self):
        # Two words on the same line close together
        self.r1 = TextRegion(region_id=0, bbox=BoundingBox(10, 20, 50, 40), text="MRP", confidence=0.9)
        self.r2 = TextRegion(region_id=1, bbox=BoundingBox(55, 20, 100, 40), text="Rs. 250", confidence=0.95)
        # Word on a lower line
        self.r3 = TextRegion(region_id=2, bbox=BoundingBox(10, 70, 80, 90), text="NET WT", confidence=0.85)

    def test_same_line_detection(self):
        self.assertTrue(is_same_line(self.r1, self.r2))
        self.assertFalse(is_same_line(self.r1, self.r3))

    def test_merge_nearby_regions(self):
        regions = [self.r1, self.r2, self.r3]
        merged = merge_nearby_regions(regions, max_horizontal_gap_px=20)
        self.assertEqual(len(merged), 2)
        self.assertEqual(merged[0].text, "MRP Rs. 250")
        self.assertEqual(merged[1].text, "NET WT")
        self.assertEqual(merged[0].bbox.x1, 10)
        self.assertEqual(merged[0].bbox.x2, 100)

if __name__ == "__main__":
    unittest.main()
