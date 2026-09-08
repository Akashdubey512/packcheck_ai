"""
Unit Tests for Confidence Calibration & Scoring Engine
"""

import unittest
from ml.extraction.types import ExtractedField, FieldStatus, NormalizedValue, NormalizationStatus
from ml.confidence.types import ConfidenceStatus, CalibrationStatus
from ml.confidence.calibrator import ConfidenceCalibrator


class TestConfidenceCalibrator(unittest.TestCase):

    def setUp(self):
        self.calibrator = ConfidenceCalibrator()

    def test_confident_field_scoring(self):
        field = ExtractedField(
            field_name="mrp",
            raw_text="MRP ₹249.00",
            raw_value="₹249.00",
            normalized_value=NormalizedValue("MRP ₹249.00", {"amount": 249.0, "currency": "INR"}, NormalizationStatus.SUCCESS.value),
            source_region_ids=["0"],
            source_bbox=[10, 10, 100, 40],
            extraction_confidence=0.85,
            status=FieldStatus.EXTRACTED.value
        )
        ocr_map = {"0": {"confidence": 0.95}}
        breakdown, status = self.calibrator.compute_confidence(field, ocr_region_map=ocr_map)

        self.assertGreaterEqual(breakdown.raw_composite_score, 0.75)
        self.assertEqual(status, ConfidenceStatus.CONFIDENT.value)
        self.assertIsNone(breakdown.calibrated_probability)
        self.assertEqual(breakdown.calibration_status, CalibrationStatus.CALIBRATION_UNAVAILABLE.value)

    def test_contradictory_field_scoring(self):
        field = ExtractedField(
            field_name="mrp",
            raw_text="MRP ₹100 / Offer ₹80",
            raw_value="₹100",
            source_region_ids=["0", "1"],
            extraction_confidence=0.75,
            status=FieldStatus.MULTIPLE_CANDIDATES.value
        )
        breakdown, status = self.calibrator.compute_confidence(field)
        self.assertEqual(status, ConfidenceStatus.CONTRADICTORY.value)
        self.assertEqual(breakdown.consistency_score, 0.50)

    def test_missing_field_scoring(self):
        field = ExtractedField(field_name="common_generic_name", status=FieldStatus.NOT_FOUND.value)
        breakdown, status = self.calibrator.compute_confidence(field)
        self.assertEqual(status, ConfidenceStatus.UNAVAILABLE.value)
        self.assertEqual(breakdown.raw_composite_score, 0.0)


if __name__ == "__main__":
    unittest.main()
