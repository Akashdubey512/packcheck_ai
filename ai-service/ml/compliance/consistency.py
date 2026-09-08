"""
Contradiction & Consistency Detection Engine
Identifies conflicting information (e.g. multiple MRPs, competing dates, contradictory origin declarations).
Crucial Rule: Contradictory information is classified as REVIEW_REQUIRED, NOT an automatic legal failure.
"""

from typing import Dict, Any, List, Optional
from ml.compliance.types import ReviewItem, normalize_compliance_field_name


class ConsistencyChecker:
    """Detects cross-field and intra-field contradictions across extracted product facts."""

    def check_contradictions(
        self, audited_fields: Dict[str, Any]
    ) -> List[ReviewItem]:
        """
        Scan all audited fields for contradictions and emit ReviewItems for manual human review.
        """
        review_items: List[ReviewItem] = []

        for f_name, audited_field in audited_fields.items():
            canon_field = normalize_compliance_field_name(f_name)

            if not audited_field:
                continue

            # Check status
            status = getattr(audited_field, "status", "")
            if status == "CONTRADICTORY":
                review_items.append(
                    ReviewItem(
                        rule_id=f"RULE_CONTRADICTION_{canon_field.upper()}",
                        field_name=canon_field,
                        reason_code="CONTRADICTORY_FIELD_INFORMATION",
                        message=f"Multiple conflicting candidate values detected for '{canon_field}'.",
                        rationale=f"Extraction classifier found competing values in raw text: '{audited_field.raw_text}'."
                    )
                )

            elif status == "AMBIGUOUS":
                review_items.append(
                    ReviewItem(
                        rule_id=f"RULE_AMBIGUITY_{canon_field.upper()}",
                        field_name=canon_field,
                        reason_code="AMBIGUOUS_FIELD_FORMAT",
                        message=f"Format ambiguity detected for '{canon_field}'.",
                        rationale=f"Value normalization detected ambiguous interpretation: '{audited_field.raw_text}'."
                    )
                )

        return review_items
