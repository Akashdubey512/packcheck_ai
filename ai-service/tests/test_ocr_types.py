"""
Unit tests for ocr/types.py dataclasses
"""

import unittest
from ml.ocr.types import BoundingBox, TextRegion, OCRResult

class TestOCRTypes(unittest.TestCase):
    def test_bounding_box(self):
        bbox = BoundingBox(x1=10, y1=20, x2=110, y2=70)
        self.assertEqual(bbox.width, 100)
        self.assertEqual(bbox.height, 50)
        self.assertEqual(bbox.area, 5000)
        self.assertEqual(bbox.center, (60.0, 45.0))
        self.assertEqual(bbox.to_list(), [10, 20, 110, 70])
        
        bbox_from_list = BoundingBox.from_list([10, 20, 110, 70])
        self.assertEqual(bbox_from_list, bbox)

    def test_text_region_to_dict(self):
        bbox = BoundingBox(x1=0, y1=0, x2=50, y2=20)
        reg = TextRegion(region_id=1, bbox=bbox, text="MRP Rs. 100", confidence=0.95)
        d = reg.to_dict()
        self.assertEqual(d["region_id"], 1)
        self.assertEqual(d["bbox"], [0, 0, 50, 20])
        self.assertEqual(d["text"], "MRP Rs. 100")
        self.assertEqual(d["confidence"], 0.95)

    def test_ocr_result_to_dict(self):
        bbox = BoundingBox(x1=0, y1=0, x2=50, y2=20)
        reg = TextRegion(region_id=0, bbox=bbox, text="NET WT 500g", confidence=0.92)
        res = OCRResult(
            image_id="TEST_001",
            engine="mock_engine",
            engine_version="1.0.0",
            image_width=200,
            image_height=200,
            regions=[reg],
            full_raw_text="NET WT 500g"
        )
        d = res.to_dict()
        self.assertEqual(d["image_id"], "TEST_001")
        self.assertEqual(d["engine"], "mock_engine")
        self.assertEqual(len(d["regions"]), 1)

if __name__ == "__main__":
    unittest.main()
