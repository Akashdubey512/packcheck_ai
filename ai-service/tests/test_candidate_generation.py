"""
Unit Tests for Field Candidate Generation Engine
"""

import unittest
from ml.ocr.types import OCRResult, TextRegion, BoundingBox
from ml.extraction.candidates import CandidateGenerator


class TestCandidateGeneration(unittest.TestCase):

    def setUp(self):
        self.generator = CandidateGenerator()

    def test_mrp_candidate_generation(self):
        ocr = OCRResult(
            image_id="test_mrp",
            engine="rapidocr",
            engine_version="1.2.3",
            regions=[
                TextRegion(region_id=0, bbox=BoundingBox(10, 10, 100, 40), text="MRP ₹249.00"),
                TextRegion(region_id=1, bbox=BoundingBox(10, 50, 100, 80), text="Offer Price Rs. 199.00")
            ]
        )
        cands = self.generator.generate_candidates(ocr)
        self.assertIn("mrp", cands)
        mrp_cands = cands["mrp"]
        self.assertGreaterEqual(len(mrp_cands), 1)

    def test_net_qty_candidate_generation(self):
        ocr = OCRResult(
            image_id="test_qty",
            engine="rapidocr",
            engine_version="1.2.3",
            regions=[
                TextRegion(region_id=0, bbox=BoundingBox(10, 10, 100, 40), text="Net Weight: 500 g")
            ]
        )
        cands = self.generator.generate_candidates(ocr)
        self.assertIn("net_quantity", cands)
        qty_cands = cands["net_quantity"]
        self.assertGreaterEqual(len(qty_cands), 1)
        self.assertIn("500", qty_cands[0].raw_value)

    def test_spatial_paired_candidate_generation(self):
        ocr = OCRResult(
            image_id="test_pair",
            engine="rapidocr",
            engine_version="1.2.3",
            regions=[
                TextRegion(region_id=0, bbox=BoundingBox(10, 10, 80, 40), text="Country of Origin:"),
                TextRegion(region_id=1, bbox=BoundingBox(90, 10, 150, 40), text="India")
            ]
        )
        cands = self.generator.generate_candidates(ocr)
        country_cands = cands["country_of_origin"]
        self.assertGreaterEqual(len(country_cands), 1)
        # Check paired candidate
        paired = [c for c in country_cands if "spatial_keyword_pair" in c.evidence_types]
        self.assertGreaterEqual(len(paired), 1)
        self.assertIn("0", str(paired[0].source_region_ids[0]))


if __name__ == "__main__":
    unittest.main()
