"""
Uncertainty & Contradiction Explainability Engine
Generates human-readable explanations and candidate comparison analyses based strictly on empirical extraction signals.
"""

from typing import List, Dict, Any, Optional
from ml.extraction.types import ExtractedField, FieldStatus
from ml.confidence.types import FieldExplanation, ConfidenceBreakdown, ConfidenceStatus


class FieldExplainer:
    """Generates transparent explanations for confidence scores, status assignments, and candidate comparisons."""

    def explain_field(
        self,
        field: ExtractedField,
        confidence_breakdown: ConfidenceBreakdown,
        uncertainty_status: str
    ) -> FieldExplanation:
        """
        Generate FieldExplanation for an extracted field.
        Explanations are derived strictly from empirical candidate scores, OCR confidence,
        normalization status, and image quality metrics.
        """
        field_name = field.field_name
        reasons: List[str] = []
        candidate_comparison: Optional[List[Dict[str, Any]]] = None

        if uncertainty_status == ConfidenceStatus.UNAVAILABLE.value or field.status == FieldStatus.NOT_FOUND.value:
            return FieldExplanation(
                field_name=field_name,
                status=uncertainty_status,
                summary=f"Field '{field_name}' was not detected in OCR text output.",
                reasons=["No matching keywords or regex patterns found in detected text regions."],
                candidate_comparison=None
            )

        # 1. Document Primary Reasons
        if confidence_breakdown.ocr_confidence is not None:
            reasons.append(f"Source OCR average region confidence: {round(confidence_breakdown.ocr_confidence, 4)}")
        else:
            reasons.append("Source OCR engine did not emit region-level confidence scores.")

        reasons.append(f"Primary candidate extraction score: {round(confidence_breakdown.candidate_score, 4)}")
        
        if field.normalized_value:
            reasons.append(f"Value normalization status: {field.normalized_value.normalization_status}")

        if confidence_breakdown.image_quality_score < 0.80:
            reasons.append(f"Input image quality penalty applied (quality score: {confidence_breakdown.image_quality_score})")

        # 2. Candidate Comparison Analysis (if multiple candidates exist)
        if field.candidates and len(field.candidates) > 1:
            candidate_comparison = []
            for idx, cand in enumerate(field.candidates):
                cand_info = {
                    "candidate_rank": idx + 1,
                    "candidate_id": cand.candidate_id,
                    "raw_text": cand.raw_text,
                    "raw_value": cand.raw_value,
                    "score": round(cand.score, 4),
                    "evidence_types": cand.evidence_types,
                    "source_region_ids": cand.source_region_ids
                }
                candidate_comparison.append(cand_info)

            reasons.append(f"Multiple ({len(field.candidates)}) candidates evaluated for field '{field_name}'.")

        # 3. Formulate Summary
        if uncertainty_status == ConfidenceStatus.CONFIDENT.value:
            summary = f"Field '{field_name}' extracted with high confidence ({round(confidence_breakdown.raw_composite_score, 2)})."
        elif uncertainty_status == ConfidenceStatus.CONTRADICTORY.value:
            summary = f"Field '{field_name}' contains competing distinct candidate values (e.g. MRP vs Offer Price)."
        elif uncertainty_status == ConfidenceStatus.AMBIGUOUS.value:
            summary = f"Field '{field_name}' value contains format ambiguity (e.g. ambiguous day/month order)."
        elif uncertainty_status == ConfidenceStatus.LOW_QUALITY_EVIDENCE.value:
            summary = f"Field '{field_name}' extracted from low quality or blurred visual image region."
        else:
            summary = f"Field '{field_name}' requires verification (status: {uncertainty_status})."

        return FieldExplanation(
            field_name=field_name,
            status=uncertainty_status,
            summary=summary,
            reasons=reasons,
            candidate_comparison=candidate_comparison
        )
