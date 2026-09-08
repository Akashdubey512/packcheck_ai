"""
Unit & Integration Tests for Multi-View Inspection Subsystem
"""

import unittest
from ml.inspection.types import PackageViewType, CoverageStatus
from ml.inspection.view_classifier import classify_package_view
from ml.inspection.cross_view_fusion import fuse_cross_view_candidates

class TestMultiViewInspection(unittest.TestCase):

    def test_view_classifier_back(self):
        text = "INGREDIENTS: Water, Sugar. NUTRITIONAL INFORMATION per 100g. MANUFACTURED BY ABC Ltd."
        view = classify_package_view(text)
        self.assertEqual(view, PackageViewType.BACK.value)

    def test_view_classifier_front(self):
        text = "BRAND PREMIUM TEA NET QUANTITY 500g"
        view = classify_package_view(text)
        self.assertEqual(view, PackageViewType.FRONT.value)

    def test_cross_view_fusion_consistency(self):
        views = [
            {"view_type": "FRONT", "extracted_fields": {"mrp": {"status": "EXTRACTED", "raw_value": "₹120"}}},
            {"view_type": "BACK", "extracted_fields": {"mrp": {"status": "EXTRACTED", "raw_value": "₹120"}}}
        ]
        unified, contradictions, coverage = fuse_cross_view_candidates(views)
        self.assertEqual(len(contradictions), 0)
        self.assertEqual(coverage["coverage_status"], CoverageStatus.FULL_COVERAGE.value)
        self.assertEqual(unified["mrp"].consensus_value, "₹120")

    def test_cross_view_fusion_contradiction(self):
        views = [
            {"view_type": "FRONT", "extracted_fields": {"mrp": {"status": "EXTRACTED", "raw_value": "₹120"}}},
            {"view_type": "BACK", "extracted_fields": {"mrp": {"status": "EXTRACTED", "raw_value": "₹150"}}}
        ]
        unified, contradictions, coverage = fuse_cross_view_candidates(views)
        self.assertEqual(len(contradictions), 1)
        self.assertTrue(unified["mrp"].is_contradictory)

if __name__ == "__main__":
    unittest.main()
