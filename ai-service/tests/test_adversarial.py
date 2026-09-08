"""
Comprehensive Adversarial, Edge-Case & Failure Test Suite
"""

import unittest
from pathlib import Path
from PIL import Image
from ml.preprocessing.quality import assess_image_quality
from ml.security.upload_validator import sanitize_filename, validate_upload_file, SecurityValidationError
from ml.inspection.view_classifier import classify_package_view
from ml.inspection.cross_view_fusion import fuse_cross_view_candidates
from ml.compliance.applicability import ApplicabilityEngine
from ml.compliance.rule_schema import LegalRule

class TestAdversarialAndEdgeCases(unittest.TestCase):

    def test_path_traversal_sanitization(self):
        malicious = "../../../../../etc/shadow"
        clean = sanitize_filename(malicious)
        self.assertNotIn("..", clean)
        self.assertEqual(clean, "shadow")

    def test_unusable_image_quality(self):
        # Blank black image has 0 Laplacian blur score
        black_img = Image.new("L", (100, 100), color=0)
        res = assess_image_quality(black_img)
        self.assertIn(res["status"], ("POOR", "UNUSABLE"))

    def test_hindi_mixed_text_view_classification(self):
        text = "सामग्री INGREDIENTS: Wheat Flour. MFG DATE: 08/2026. ग्राहक सेवा Customer Care: 1800-000-000"
        view = classify_package_view(text)
        self.assertEqual(view, "BACK")

    def test_conflicting_views_mrp_contradiction(self):
        views = [
            {"view_type": "FRONT", "extracted_fields": {"mrp": {"status": "EXTRACTED", "raw_value": "₹120"}}},
            {"view_type": "BACK", "extracted_fields": {"mrp": {"status": "EXTRACTED", "raw_value": "₹150"}}}
        ]
        unified, contradictions, coverage = fuse_cross_view_candidates(views)
        self.assertEqual(len(contradictions), 1)
        self.assertTrue(unified["mrp"].is_contradictory)

    def test_unknown_category_applicability(self):
        engine = ApplicabilityEngine()
        rule = LegalRule(
            rule_id="LM-PC-EXP-001",
            field="expiry_or_use_by_date",
            source="Rule 6(1)(f)",
            source_title="Packaged Commodities Rules",
            rule_version="2022.1",
            severity="HIGH"
        )
        ctx = {"category": "unregistered_custom_category_xyz"}
        state = engine.determine_applicability(rule, package_context=ctx)
        self.assertEqual(state, "UNKNOWN")

if __name__ == "__main__":
    unittest.main()
