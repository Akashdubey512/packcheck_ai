"""
Unit Tests for Value Normalization Engine
"""

import unittest
from ml.extraction.types import NormalizationStatus
from ml.extraction.normalizer import ValueNormalizer, sanitize_ocr_digits


class TestValueNormalizer(unittest.TestCase):

    def test_mrp_normalization(self):
        cases = [
            ("₹249", 249.0),
            ("Rs 249", 249.0),
            ("Rs. 249.00", 249.0),
            ("MRP: ₹ 249.50", 249.50)
        ]
        for raw, expected in cases:
            norm = ValueNormalizer.normalize_mrp(raw)
            self.assertEqual(norm.normalization_status, NormalizationStatus.SUCCESS.value)
            self.assertEqual(norm.normalized_value["amount"], expected)
            self.assertEqual(norm.normalized_value["currency"], "INR")

    def test_quantity_normalization(self):
        # 500 g
        n1 = ValueNormalizer.normalize_net_quantity("500 g")
        self.assertEqual(n1.normalized_value["canonical_value"], 500.0)
        self.assertEqual(n1.normalized_value["canonical_unit"], "g")

        # 1 kg -> 1000 g
        n2 = ValueNormalizer.normalize_net_quantity("1 kg")
        self.assertEqual(n2.normalized_value["canonical_value"], 1000.0)
        self.assertEqual(n2.normalized_value["canonical_unit"], "g")

        # 250 ml -> 250 ml
        n3 = ValueNormalizer.normalize_net_quantity("250 ml")
        self.assertEqual(n3.normalized_value["canonical_value"], 250.0)
        self.assertEqual(n3.normalized_value["canonical_unit"], "ml")

        # 1 L -> 1000 ml
        n4 = ValueNormalizer.normalize_net_quantity("1 L")
        self.assertEqual(n4.normalized_value["canonical_value"], 1000.0)
        self.assertEqual(n4.normalized_value["canonical_unit"], "ml")

    def test_date_normalization(self):
        # MM/YYYY
        d1 = ValueNormalizer.normalize_date("08/2026")
        self.assertEqual(d1.normalized_value["iso"], "2026-08")

        # DD/MM/YYYY unambiguous (day > 12)
        d2 = ValueNormalizer.normalize_date("31/08/2026")
        self.assertEqual(d2.normalized_value["iso"], "2026-08-31")

        # Ambiguous date (day <= 12 and month <= 12)
        d3 = ValueNormalizer.normalize_date("05/06/2026")
        self.assertEqual(d3.normalization_status, NormalizationStatus.AMBIGUOUS.value)
        self.assertIn("possible_alternatives", d3.normalized_value)

    def test_country_normalization(self):
        c1 = ValueNormalizer.normalize_country("Made in India")
        self.assertEqual(c1.normalized_value["country"], "India")

        c2 = ValueNormalizer.normalize_country("Country of Origin: India")
        self.assertEqual(c2.normalized_value["country"], "India")

    def test_consumer_care_normalization(self):
        raw = "Customer Care: 1800-123-4567, email: care@brand.com"
        cc = ValueNormalizer.normalize_consumer_care(raw)
        self.assertEqual(cc.normalized_value["phone"], "1800-123-4567")
        self.assertEqual(cc.normalized_value["email"], "care@brand.com")

    def test_unit_sale_price_normalization(self):
        usp = ValueNormalizer.normalize_unit_sale_price("₹10 / 100 g")
        self.assertEqual(usp.normalized_value["amount"], 10.0)
        self.assertEqual(usp.normalized_value["unit_basis_quantity"], 100.0)
        self.assertEqual(usp.normalized_value["unit_basis_unit"], "g")

    def test_ocr_digit_sanitization(self):
        self.assertEqual(sanitize_ocr_digits("2O9"), "209")
        self.assertEqual(sanitize_ocr_digits("l.50"), "1.50")


if __name__ == "__main__":
    unittest.main()
