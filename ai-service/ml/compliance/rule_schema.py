"""
Legal Metrology Rule Schema
Defines strongly typed LegalRule dataclass and serialization specifications.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List


@dataclass
class LegalRule:
    """Represents a structured, versioned Legal Metrology rule specification."""
    rule_id: str
    field: str
    source: str
    source_title: str
    rule_version: str
    effective_date: str = "NOT_AVAILABLE"
    requirement: str = ""
    applicability: str = "ALL_PACKAGED_COMMODITIES"
    validation_type: str = "MANDATORY_PRESENCE"
    severity: str = "HIGH"
    explanation: str = ""
    evidence_requirement: str = "MANDATORY_EVIDENCE"
    is_deprecated: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "field": self.field,
            "source": self.source,
            "source_title": self.source_title,
            "rule_version": self.rule_version,
            "effective_date": self.effective_date,
            "requirement": self.requirement,
            "applicability": self.applicability,
            "validation_type": self.validation_type,
            "severity": self.severity,
            "explanation": self.explanation,
            "evidence_requirement": self.evidence_requirement,
            "is_deprecated": self.is_deprecated
        }
