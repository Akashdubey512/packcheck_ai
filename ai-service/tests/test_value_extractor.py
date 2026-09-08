"""
Unit Tests for Field Value Extractor Engine
"""

import unittest
from ml.extraction.types import FieldCandidate, FieldStatus
from ml.extraction.extractor import FieldExtractor


class TestValueExtractor(unittest.TestCase):

    def setUp(self):
        self.extractor = FieldExtractor()

    def test_mrp_extraction(self):
        cands = [
            FieldCandidate(
                candidate_id="c1",
                field_name="mrp",
                raw_text="MRP ₹249.00",
                raw_value="₹249.00",
                source_region_ids=["reg_0"],
                score=0.85
            )
        ]
        field = self.extractor.extract_field("mrp", cands)
        self.assertEqual(field.field_name, "mrp")
        self.assertEqual(field.status, FieldStatus.EXTRACTED.value)
        self.assertIsNotNone(field.normalized_value)
        self.assertEqual(field.normalized_value.normalized_value["amount"], 249.0)

    def test_net_quantity_extraction(self):
        cands = [
            FieldCandidate(
                candidate_id="c1",
                field_name="net_quantity",
                raw_text="Net Qty 1.5 kg",
                raw_value="1.5 kg",
                source_region_ids=["reg_1"],
                score=0.85
            )
        ]
        field = self.extractor.extract_field("net_quantity", cands)
        self.assertEqual(field.status, FieldStatus.EXTRACTED.value)
        norm = field.normalized_value.normalized_value
        self.assertEqual(norm["value"], 1.5)
        self.assertEqual(norm["unit"], "kg")
        self.assertEqual(norm["canonical_value"], 1500.0)
        self.assertEqual(norm["canonical_unit"], "g")

    def test_missing_field_extraction(self):
        field = self.extractor.extract_field("common_generic_name", [])
        self.assertEqual(field.status, FieldStatus.NOT_FOUND.value)
        self.assertIsNone(field.normalized_value)


if __name__ == "__main__":
    unittest.main()
