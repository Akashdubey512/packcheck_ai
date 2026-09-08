"""
Unit Tests for Phase 4 Extraction Types and Schemas
"""

import unittest
from ml.extraction.types import (
    FieldStatus, NormalizationStatus, NormalizedValue, FieldCandidate,
    ExtractedField, ProductFacts, ExtractionSourceMetadata,
    CANONICAL_FIELD_NAMES, FIELD_ALIASES, normalize_field_name
)


class TestExtractionTypes(unittest.TestCase):

    def test_canonical_field_names(self):
        self.assertEqual(len(CANONICAL_FIELD_NAMES), 9)
        self.assertIn("mrp", CANONICAL_FIELD_NAMES)
        self.assertIn("net_quantity", CANONICAL_FIELD_NAMES)
        self.assertIn("manufacturer_name_and_address", CANONICAL_FIELD_NAMES)

    def test_field_aliases(self):
        self.assertEqual(normalize_field_name("mrp_inclusive_of_taxes"), "mrp")
        self.assertEqual(normalize_field_name("manufacturer_name_address"), "manufacturer_name_and_address")
        self.assertEqual(normalize_field_name("consumer_care_contact"), "consumer_care_details")
        self.assertEqual(normalize_field_name("expiry_or_use_by_date"), "best_before_expiry")

    def test_field_statuses(self):
        self.assertEqual(FieldStatus.EXTRACTED.value, "EXTRACTED")
        self.assertEqual(FieldStatus.NOT_FOUND.value, "NOT_FOUND")
        self.assertEqual(FieldStatus.AMBIGUOUS.value, "AMBIGUOUS")
        self.assertEqual(FieldStatus.MULTIPLE_CANDIDATES.value, "MULTIPLE_CANDIDATES")

    def test_extracted_field_serialization(self):
        norm = NormalizedValue(
            raw_text="MRP ₹249.00",
            normalized_value={"amount": 249.0, "currency": "INR"},
            normalization_status=NormalizationStatus.SUCCESS.value
        )
        cand = FieldCandidate(
            candidate_id="cand_1",
            field_name="mrp",
            raw_text="MRP ₹249.00",
            raw_value="₹249.00",
            source_region_ids=["reg_0"],
            source_bbox=[10, 10, 100, 40],
            score=0.95
        )
        field = ExtractedField(
            field_name="mrp",
            raw_text="MRP ₹249.00",
            raw_value="₹249.00",
            normalized_value=norm,
            source_region_ids=["reg_0"],
            source_text="MRP ₹249.00",
            source_bbox=[10, 10, 100, 40],
            extraction_confidence=0.95,
            status=FieldStatus.EXTRACTED.value,
            candidates=[cand]
        )
        d = field.to_dict()
        self.assertEqual(d["field_name"], "mrp")
        self.assertEqual(d["normalized_value"]["normalized_value"]["amount"], 249.0)
        self.assertEqual(d["status"], "EXTRACTED")

    def test_product_facts_serialization(self):
        facts = ProductFacts(product_id="test_img_001")
        d = facts.to_dict()
        self.assertEqual(d["product_id"], "test_img_001")
        self.assertEqual(d["source"]["extraction_version"], "1.0.0")


if __name__ == "__main__":
    unittest.main()
