"""
Confidence Calibration & Multi-Factor Scoring Engine
Calculates multi-signal composite confidence scores, enforces calibration constraints,
and assigns explicit uncertainty statuses.
"""

from typing import Dict, Any, Optional, Tuple
from ml.extraction.types import ExtractedField, FieldStatus, NormalizationStatus
from ml.confidence.types import ConfidenceBreakdown, ConfidenceStatus, CalibrationStatus


class ConfidenceCalibrator:
    """Multi-factor confidence scoring and calibration engine."""

    def __init__(self):
        # Weights for composite confidence score aggregation
        self.weights = {
            "ocr": 0.25,
            "candidate": 0.35,
            "normalization": 0.20,
            "quality": 0.10,
            "consistency": 0.10
        }

    def compute_confidence(
        self,
        field: ExtractedField,
        ocr_region_map: Optional[Dict[str, Any]] = None,
        quality_metrics: Optional[Dict[str, Any]] = None
    ) -> Tuple[ConfidenceBreakdown, str]:
        """
        Calculate composite confidence breakdown and assign explicit confidence status.
        
        CRITICAL ARCHITECTURAL RULE:
        Distinguishes raw composite confidence score from calibrated probability.
        When calibration ground truth is unavailable, calibration_status = CALIBRATION_UNAVAILABLE
        and calibrated_probability = None. NO FABRICATED CALIBRATION CURVES.
        """
        if not field or field.status == FieldStatus.NOT_FOUND.value:
            breakdown = ConfidenceBreakdown(
                ocr_confidence=None,
                candidate_score=0.0,
                normalization_score=0.0,
                image_quality_score=1.0,
                consistency_score=1.0,
                raw_composite_score=0.0,
                calibrated_probability=None,
                calibration_status=CalibrationStatus.CALIBRATION_UNAVAILABLE.value
            )
            return breakdown, ConfidenceStatus.UNAVAILABLE.value

        # 1. Extract component scores
        # OCR Confidence from source regions
        ocr_conf = self._get_ocr_confidence(field, ocr_region_map)
        
        # Candidate score from Phase 4
        cand_score = field.extraction_confidence or 0.0

        # Normalization score
        norm_score = self._get_normalization_score(field)

        # Image quality score
        qual_score = self._get_quality_score(quality_metrics)

        # Consistency score (penalize multiple competing candidates)
        cons_score = 0.50 if field.status == FieldStatus.MULTIPLE_CANDIDATES.value else 1.0

        # 2. Aggregate raw composite score
        effective_ocr_conf = ocr_conf if ocr_conf is not None else 0.80
        raw_composite = (
            self.weights["ocr"] * effective_ocr_conf +
            self.weights["candidate"] * cand_score +
            self.weights["normalization"] * norm_score +
            self.weights["quality"] * qual_score +
            self.weights["consistency"] * cons_score
        )
        raw_composite = min(1.0, max(0.0, raw_composite))

        # 3. Calibration: Ground truth unavailable -> CALIBRATION_UNAVAILABLE
        calibrated_prob = None
        calib_status = CalibrationStatus.CALIBRATION_UNAVAILABLE.value

        breakdown = ConfidenceBreakdown(
            ocr_confidence=ocr_conf,
            candidate_score=cand_score,
            normalization_score=norm_score,
            image_quality_score=qual_score,
            consistency_score=cons_score,
            raw_composite_score=raw_composite,
            calibrated_probability=calibrated_prob,
            calibration_status=calib_status
        )

        # 4. Explicit Uncertainty Status Assignment
        status = self._assign_uncertainty_status(field, breakdown, qual_score)

        return breakdown, status

    def _get_ocr_confidence(
        self, field: ExtractedField, ocr_region_map: Optional[Dict[str, Any]]
    ) -> Optional[float]:
        """Extract average OCR confidence across source region IDs."""
        if not ocr_region_map or not field.source_region_ids:
            return None

        confs = []
        for r_id in field.source_region_ids:
            r_id_str = str(r_id)
            if r_id_str in ocr_region_map:
                region = ocr_region_map[r_id_str]
                c = region.get("confidence")
                if c is not None:
                    confs.append(float(c))

        return sum(confs) / len(confs) if confs else None

    @staticmethod
    def _get_normalization_score(field: ExtractedField) -> float:
        """Score value normalization status."""
        if not field.normalized_value:
            return 0.50

        status = field.normalized_value.normalization_status
        if status == NormalizationStatus.SUCCESS.value:
            return 1.0
        elif status == NormalizationStatus.PARTIAL.value:
            return 0.70
        elif status == NormalizationStatus.AMBIGUOUS.value:
            return 0.50
        elif status == NormalizationStatus.FAILED.value:
            return 0.0
        return 0.80

    @staticmethod
    def _get_quality_score(quality_metrics: Optional[Dict[str, Any]]) -> float:
        """Derive 0-1 quality score from Phase 2 preprocessing quality metrics."""
        if not quality_metrics:
            return 1.0

        status = quality_metrics.get("status", "GOOD")
        if status == "GOOD":
            return 1.0
        elif status == "ACCEPTABLE":
            return 0.80
        elif status == "POOR":
            return 0.50
        elif status == "UNREADABLE":
            return 0.10
        return 0.80

    @staticmethod
    def _assign_uncertainty_status(
        field: ExtractedField, breakdown: ConfidenceBreakdown, quality_score: float
    ) -> str:
        """Assign explicit uncertainty status based on field signals."""
        if quality_score < 0.40:
            return ConfidenceStatus.LOW_QUALITY_EVIDENCE.value

        if field.status == FieldStatus.MULTIPLE_CANDIDATES.value:
            return ConfidenceStatus.CONTRADICTORY.value

        if field.status == FieldStatus.AMBIGUOUS.value or (
            field.normalized_value and field.normalized_value.normalization_status == NormalizationStatus.AMBIGUOUS.value
        ):
            return ConfidenceStatus.AMBIGUOUS.value

        if breakdown.raw_composite_score < 0.40 or field.status == FieldStatus.REVIEW_REQUIRED.value:
            return ConfidenceStatus.REVIEW_REQUIRED.value

        if breakdown.raw_composite_score >= 0.75:
            return ConfidenceStatus.CONFIDENT.value

        return ConfidenceStatus.UNCERTAIN.value
