"""
Unit tests for ocr/reading_order.py module
"""

import unittest
from ml.ocr.types import TextRegion, BoundingBox
from ml.ocr.reading_order import sort_reading_order

class TestReadingOrder(unittest.TestCase):
    def test_top_down_left_right_sort(self):
        # Unordered regions
        r_bottom_left = TextRegion(region_id=0, bbox=BoundingBox(10, 100, 50, 120), text="BOTTOM_LEFT")
        r_top_right = TextRegion(region_id=1, bbox=BoundingBox(100, 10, 150, 30), text="TOP_RIGHT")
        r_top_left = TextRegion(region_id=2, bbox=BoundingBox(10, 10, 50, 30), text="TOP_LEFT")
        
        input_regions = [r_bottom_left, r_top_right, r_top_left]
        sorted_regions = sort_reading_order(input_regions)

        self.assertEqual(sorted_regions[0].text, "TOP_LEFT")
        self.assertEqual(sorted_regions[1].text, "TOP_RIGHT")
        self.assertEqual(sorted_regions[2].text, "BOTTOM_LEFT")

if __name__ == "__main__":
    unittest.main()
