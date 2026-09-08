"""
Unit Tests for Field Candidate Classifier Engine
"""

import unittest
from ml.extraction.types import FieldCandidate, FieldStatus
from ml.extraction.classifier import FieldClassifier


class TestFieldClassifier(unittest.TestCase):

    def setUp(self):
        self.classifier = FieldClassifier()

    def test_single_high_confidence_candidate(self):
        cand = FieldCandidate(
            candidate_id="cand_1",
            field_name="mrp",
            raw_text="MRP ₹ 249.00",
            raw_value="₹ 249.00",
            source_region_ids=["reg_0"],
            score=0.85,
            evidence_types=["regex_match"]
        )
        primary, conf, status, ranked = self.classifier.classify_candidates("mrp", [cand])
        self.assertEqual(primary.candidate_id, "cand_1")
        self.assertEqual(status, FieldStatus.EXTRACTED.value)
        self.assertGreaterEqual(conf, 0.70)

    def test_multiple_competing_candidates(self):
        c1 = FieldCandidate(
            candidate_id="cand_mrp",
            field_name="mrp",
            raw_text="MRP ₹ 100.00",
            raw_value="₹ 100.00",
            source_region_ids=["reg_1"],
            score=0.85,
            evidence_types=["regex_match"]
        )
        c2 = FieldCandidate(
            candidate_id="cand_offer",
            field_name="mrp",
            raw_text="Offer Price ₹ 80.00",
            raw_value="₹ 80.00",
            source_region_ids=["reg_2"],
            score=0.75,
            evidence_types=["regex_match"]
        )
        primary, conf, status, ranked = self.classifier.classify_candidates("mrp", [c1, c2])
        self.assertEqual(len(ranked), 2)
        self.assertEqual(status, FieldStatus.MULTIPLE_CANDIDATES.value)
        self.assertEqual(primary.raw_value, "₹ 100.00")


if __name__ == "__main__":
    unittest.main()
