"""
Unit Tests for Phase 5 Confidence Types and Schemas
"""

import unittest
from ml.confidence.types import (
    ConfidenceStatus, CalibrationStatus, ConfidenceBreakdown, EvidenceCrop,
    EvidenceManifest, InputProvenance, FieldExplanation, AuditedField,
    AuditedProductFacts
)


class TestConfidenceTypes(unittest.TestCase):

    def test_confidence_statuses(self):
        self.assertEqual(ConfidenceStatus.CONFIDENT.value, "CONFIDENT")
        self.assertEqual(ConfidenceStatus.CONTRADICTORY.value, "CONTRADICTORY")
        self.assertEqual(ConfidenceStatus.AMBIGUOUS.value, "AMBIGUOUS")
        self.assertEqual(ConfidenceStatus.REVIEW_REQUIRED.value, "REVIEW_REQUIRED")
        self.assertEqual(ConfidenceStatus.UNAVAILABLE.value, "UNAVAILABLE")

    def test_calibration_statuses(self):
        self.assertEqual(CalibrationStatus.CALIBRATION_UNAVAILABLE.value, "CALIBRATION_UNAVAILABLE")

    def test_confidence_breakdown_serialization(self):
        cb = ConfidenceBreakdown(
            ocr_confidence=0.92,
            candidate_score=0.85,
            raw_composite_score=0.88,
            calibrated_probability=None,
            calibration_status=CalibrationStatus.CALIBRATION_UNAVAILABLE.value
        )
        d = cb.to_dict()
        self.assertEqual(d["ocr_confidence"], 0.92)
        self.assertIsNone(d["calibrated_probability"])
        self.assertEqual(d["calibration_status"], "CALIBRATION_UNAVAILABLE")

    def test_evidence_crop_serialization(self):
        crop = EvidenceCrop(
            crop_id="crop_01",
            field_name="mrp",
            region_id="0",
            bbox=[10, 20, 100, 50],
            image_path="processed_data/evidence_crops/test/crop_01.png",
            crop_sha256="abc123def456",
            width=90,
            height=30
        )
        d = crop.to_dict()
        self.assertEqual(d["crop_id"], "crop_01")
        self.assertEqual(d["crop_sha256"], "abc123def456")

    def test_input_provenance_serialization(self):
        prov = InputProvenance(
            input_sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            dataset_version="1.0.0",
            ocr_engine="rapidocr"
        )
        d = prov.to_dict()
        self.assertEqual(d["dataset_version"], "1.0.0")
        self.assertEqual(d["confidence_version"], "1.0.0")


if __name__ == "__main__":
    unittest.main()
