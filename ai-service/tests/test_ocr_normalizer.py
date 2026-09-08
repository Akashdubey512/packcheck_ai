"""
Unit tests for ocr/normalizer.py module
"""

import unittest
from ml.ocr.normalizer import normalize_ocr_text, process_text_pair

class TestOCRNormalizer(unittest.TestCase):
    def test_whitespace_normalization(self):
        raw = "   MRP   Rs.   100.00   \n  INCL   TAXES  "
        norm = normalize_ocr_text(raw)
        self.assertEqual(norm, "MRP Rs. 100.00\nINCL TAXES")

    def test_unicode_normalization(self):
        raw = "नेट  मात्रा  500g"
        raw_out, norm_out = process_text_pair(raw)
        self.assertEqual(raw_out, raw)
        self.assertEqual(norm_out, "नेट मात्रा 500g")

    def test_none_input(self):
        raw, norm = process_text_pair(None)
        self.assertEqual(raw, "")
        self.assertEqual(norm, "")

if __name__ == "__main__":
    unittest.main()
