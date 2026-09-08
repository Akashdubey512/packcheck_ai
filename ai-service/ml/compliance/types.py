"""
Phase 6 Data Types & Legal Compliance Schemas
Defines structured dataclasses, statuses, and field mappings for Legal Metrology compliance evaluation.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional, Union


class ComplianceStatus(str, Enum):
    """Overall Legal Metrology compliance verdict statuses."""
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class FieldValidationResult(str, Enum):
    """Specific field validation outcomes."""
    PASS = "PASS"
    FAIL = "FAIL"
    MISSING = "MISSING"
    INVALID_FORMAT = "INVALID_FORMAT"
    INVALID_VALUE = "INVALID_VALUE"
    AMBIGUOUS = "AMBIGUOUS"
    MULTIPLE_CANDIDATES = "MULTIPLE_CANDIDATES"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


class ApplicabilityState(str, Enum):
    """Rule applicability determination state."""
    APPLICABLE = "APPLICABLE"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    UNKNOWN = "UNKNOWN"


# 9 Mandatory Legal Metrology fields (Phase 6 Canonical Terminology)
CANONICAL_COMPLIANCE_FIELDS = [
    "manufacturer_name_address",
    "country_of_origin",
    "generic_name",
    "net_quantity",
    "manufacture_or_packing_date",
    "expiry_or_use_by_date",
    "mrp_inclusive_of_taxes",
    "consumer_care_contact",
    "unit_sale_price"
]

# Field Name Alias Mapping to preserve 100% backward compatibility with Phase 4/5
FIELD_ALIAS_MAP = {
    "manufacturer_name_and_address": "manufacturer_name_address",
    "manufacturer": "manufacturer_name_address",
    "country": "country_of_origin",
    "common_generic_name": "generic_name",
    "manufacturing_packing_date": "manufacture_or_packing_date",
    "mfd_date": "manufacture_or_packing_date",
    "best_before_expiry": "expiry_or_use_by_date",
    "expiry": "expiry_or_use_by_date",
    "mrp": "mrp_inclusive_of_taxes",
    "mrp_inclusive_of_taxes": "mrp_inclusive_of_taxes",
    "consumer_care_details": "consumer_care_contact",
    "consumer_care_contact": "consumer_care_contact",
    "unit_sale_price": "unit_sale_price"
}


def normalize_compliance_field_name(field_name: str) -> str:
    """Map any field alias or Phase 4 name to canonical Phase 6 compliance field name."""
    clean = field_name.strip().lower()
    return FIELD_ALIAS_MAP.get(clean, clean)


@dataclass
class FieldRuleOutcome:
    """Represents the validation result of a single legal rule evaluated against a field."""
    rule_id: str
    field_name: str
    status: str  # FieldValidationResult
    reason_code: str
    explanation: str
    evidence_region_ids: List[str] = field(default_factory=list)
    source_text: str = ""
    extracted_value: str = ""
    normalized_value: Optional[Dict[str, Any]] = None
    severity: str = "HIGH"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "field_name": self.field_name,
            "status": self.status,
            "reason_code": self.reason_code,
            "explanation": self.explanation,
            "evidence_region_ids": self.evidence_region_ids,
            "source_text": self.source_text,
            "extracted_value": self.extracted_value,
            "normalized_value": self.normalized_value,
            "severity": self.severity
        }


@dataclass
class ViolationItem:
    """Represents a confirmed legal non-compliance violation."""
    rule_id: str
    field_name: str
    severity: str
    reason_code: str
    message: str
    evidence_region_ids: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "field_name": self.field_name,
            "severity": self.severity,
            "reason_code": self.reason_code,
            "message": self.message,
            "evidence_region_ids": self.evidence_region_ids
        }


@dataclass
class ReviewItem:
    """Represents an item requiring human review due to extraction uncertainty or ambiguity."""
    rule_id: str
    field_name: str
    reason_code: str
    message: str
    rationale: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "field_name": self.field_name,
            "reason_code": self.reason_code,
            "message": self.message,
            "rationale": self.rationale
        }


@dataclass
class ComplianceProvenance:
    """Cryptographic provenance and pipeline version manifest for compliance decisions."""
    input_sha256: str
    dataset_version: str = "1.0.0"
    preprocessing_version: str = "1.0.0"
    ocr_engine: str = "rapidocr"
    ocr_version: str = "1.2.3"
    extraction_version: str = "1.0.0"
    confidence_version: str = "1.0.0"
    compliance_engine_version: str = "1.0.0"
    rule_registry_version: str = "2022.1"
    evaluated_at: str = ""
    rule_ids_used: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "input_sha256": self.input_sha256,
            "dataset_version": self.dataset_version,
            "preprocessing_version": self.preprocessing_version,
            "ocr_engine": self.ocr_engine,
            "ocr_version": self.ocr_version,
            "extraction_version": self.extraction_version,
            "confidence_version": self.confidence_version,
            "compliance_engine_version": self.compliance_engine_version,
            "rule_registry_version": self.rule_registry_version,
            "evaluated_at": self.evaluated_at,
            "rule_ids_used": self.rule_ids_used
        }


@dataclass
class ComplianceResult:
    """Final decision payload produced by Phase 6 Legal Metrology Rule Engine."""
    product_id: str
    overall_status: str  # ComplianceStatus (COMPLIANT, NON_COMPLIANT, REVIEW_REQUIRED, INSUFFICIENT_EVIDENCE)
    rule_version: str = "2022.1"
    evaluated_at: str = ""
    rules_evaluated: List[str] = field(default_factory=list)
    field_results: List[FieldRuleOutcome] = field(default_factory=list)
    violations: List[ViolationItem] = field(default_factory=list)
    review_items: List[ReviewItem] = field(default_factory=list)
    evidence: Dict[str, Any] = field(default_factory=dict)
    explanations: List[Dict[str, Any]] = field(default_factory=list)
    provenance: Optional[ComplianceProvenance] = None
    execution_time_ms: float = 0.0
    errors: List[Dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "product_id": self.product_id,
            "overall_status": self.overall_status,
            "rule_version": self.rule_version,
            "evaluated_at": self.evaluated_at,
            "rules_evaluated": self.rules_evaluated,
            "field_results": [f.to_dict() for f in self.field_results],
            "violations": [v.to_dict() for v in self.violations],
            "review_items": [r.to_dict() for r in self.review_items],
            "evidence": self.evidence,
            "explanations": self.explanations,
            "provenance": self.provenance.to_dict() if self.provenance else None,
            "execution_time_ms": round(self.execution_time_ms, 2),
            "errors": self.errors
        }
