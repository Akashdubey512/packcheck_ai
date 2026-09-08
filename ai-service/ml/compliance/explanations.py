"""
Legal Compliance Explanation Engine
Generates evidence-backed, human-readable legal audit explanations from structured field outcomes.
"""

from typing import Dict, Any, List, Optional
from ml.compliance.types import FieldRuleOutcome, ComplianceResult


class ComplianceExplainer:
    """Generates transparent, evidence-backed explanations for legal compliance verdicts."""

    def generate_explanations(
        self, field_outcomes: List[FieldRuleOutcome], rule_version: str = "2022.1"
    ) -> List[Dict[str, Any]]:
        """
        Generate a list of structured, audit-ready explanation objects.
        """
        explanations = []

        for outcome in field_outcomes:
            exp_dict = {
                "rule_id": outcome.rule_id,
                "field": outcome.field_name,
                "status": outcome.status,
                "rule_version": rule_version,
                "reason_code": outcome.reason_code,
                "explanation": outcome.explanation,
                "evidence_found": {
                    "source_text": outcome.source_text,
                    "extracted_value": outcome.extracted_value,
                    "normalized_value": outcome.normalized_value,
                    "evidence_region_ids": outcome.evidence_region_ids
                }
            }
            explanations.append(exp_dict)

        return explanations
