"""
Compliance Decision Model Engine
Aggregates field validation rule outcomes, contradictions, and evidence completeness into overall compliance verdicts.
Enforces strict legal safety: Extraction Uncertainty != Non-Compliance.
"""

import time
from typing import Dict, Any, List, Optional
from ml.compliance.types import (
    ComplianceResult, ComplianceStatus, FieldRuleOutcome,
    FieldValidationResult, ViolationItem, ReviewItem,
    normalize_compliance_field_name
)


class ComplianceDecisionEngine:
    """Combines field outcomes into structured ComplianceResult objects."""

    def make_decision(
        self,
        product_id: str,
        field_outcomes: List[FieldRuleOutcome],
        review_items: List[ReviewItem],
        evidence_manifest: Optional[Any] = None,
        provenance: Optional[Any] = None,
        rule_version: str = "2022.1"
    ) -> ComplianceResult:
        """
        Synthesize individual field outcomes and determine overall compliance status.
        
        Decision Rules:
        1. If any field outcome is FAIL (demonstrably absent mandatory declaration) -> NON_COMPLIANT.
        2. Else if any field outcome is REVIEW_REQUIRED, AMBIGUOUS, MULTIPLE_CANDIDATES, or LOW_CONFIDENCE -> REVIEW_REQUIRED.
        3. Else if required evidence crop is missing -> INSUFFICIENT_EVIDENCE (or REVIEW_REQUIRED).
        4. Else if all applicable mandatory fields are PASS -> COMPLIANT.
        """
        start_time = time.perf_counter()

        rules_evaluated = [f.rule_id for f in field_outcomes]
        violations: List[ViolationItem] = []
        combined_reviews: List[ReviewItem] = list(review_items)

        has_confirmed_violation = False
        has_review_required = False

        for outcome in field_outcomes:
            if outcome.status == FieldValidationResult.FAIL.value:
                has_confirmed_violation = True
                violations.append(
                    ViolationItem(
                        rule_id=outcome.rule_id,
                        field_name=outcome.field_name,
                        severity=outcome.severity,
                        reason_code=outcome.reason_code,
                        message=outcome.explanation,
                        evidence_region_ids=outcome.evidence_region_ids
                    )
                )

            elif outcome.status in [
                FieldValidationResult.REVIEW_REQUIRED.value,
                FieldValidationResult.AMBIGUOUS.value,
                FieldValidationResult.MULTIPLE_CANDIDATES.value,
                FieldValidationResult.LOW_CONFIDENCE.value,
                FieldValidationResult.INVALID_FORMAT.value
            ]:
                has_review_required = True
                combined_reviews.append(
                    ReviewItem(
                        rule_id=outcome.rule_id,
                        field_name=outcome.field_name,
                        reason_code=outcome.reason_code,
                        message=outcome.explanation,
                        rationale="Field validation indicates extraction uncertainty or format ambiguity requiring human audit."
                    )
                )

        # Check evidence crop completeness
        if evidence_manifest and hasattr(evidence_manifest, "crops"):
            crop_field_names = [normalize_compliance_field_name(c.field_name) for c in evidence_manifest.crops if hasattr(c, "field_name")]
            for outcome in field_outcomes:
                if outcome.status == FieldValidationResult.PASS.value:
                    canon_outcome_field = normalize_compliance_field_name(outcome.field_name)
                    if canon_outcome_field not in crop_field_names:
                        has_review_required = True
                        combined_reviews.append(
                            ReviewItem(
                                rule_id=outcome.rule_id,
                                field_name=outcome.field_name,
                                reason_code="MISSING_VISUAL_EVIDENCE_CROP",
                                message=f"Field '{outcome.field_name}' passed text validation but visual evidence crop is missing.",
                                rationale="Legal verdict requires visual evidence crop confirmation."
                            )
                        )

        # Determine Overall Compliance Status
        if has_confirmed_violation:
            overall_status = ComplianceStatus.NON_COMPLIANT.value
        elif has_review_required or len(combined_reviews) > 0:
            overall_status = ComplianceStatus.REVIEW_REQUIRED.value
        elif len(field_outcomes) == 0:
            overall_status = ComplianceStatus.INSUFFICIENT_EVIDENCE.value
        else:
            overall_status = ComplianceStatus.COMPLIANT.value

        execution_time_ms = (time.perf_counter() - start_time) * 1000.0

        return ComplianceResult(
            product_id=product_id,
            overall_status=overall_status,
            rule_version=rule_version,
            evaluated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            rules_evaluated=rules_evaluated,
            field_results=field_outcomes,
            violations=violations,
            review_items=combined_reviews,
            evidence=evidence_manifest.to_dict() if evidence_manifest else {},
            explanations=[],  # Populated by Explanations Engine
            provenance=provenance,
            execution_time_ms=execution_time_ms,
            errors=[]
        )
