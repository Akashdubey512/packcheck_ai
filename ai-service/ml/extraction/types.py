"""
Phase 4 Data Types & Field Schemas
Defines structured dataclasses, statuses, and field definitions for mandatory Legal Metrology extraction.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional, Union


class FieldStatus(str, Enum):
    """Explicit field extraction statuses as per Phase 4 requirements."""
    EXTRACTED = "EXTRACTED"
    NOT_FOUND = "NOT_FOUND"
    AMBIGUOUS = "AMBIGUOUS"
    INVALID_FORMAT = "INVALID_FORMAT"
    MULTIPLE_CANDIDATES = "MULTIPLE_CANDIDATES"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


class NormalizationStatus(str, Enum):
    """Explicit normalization status values."""
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    AMBIGUOUS = "AMBIGUOUS"
    UNTOUCHED = "UNTOUCHED"


# 9 Mandatory Legal Metrology field names from legal_metrology_rules.json
CANONICAL_FIELD_NAMES = [
    "manufacturer_name_and_address",
    "country_of_origin",
    "common_generic_name",
    "net_quantity",
    "manufacturing_packing_date",
    "best_before_expiry",
    "mrp",
    "consumer_care_details",
    "unit_sale_price"
]

# Field Name Aliases to map alternate prompt/user terminologies seamlessly
FIELD_ALIASES = {
    "manufacturer_name_address": "manufacturer_name_and_address",
    "manufacturer": "manufacturer_name_and_address",
    "country": "country_of_origin",
    "generic_name": "common_generic_name",
    "manufacture_or_packing_date": "manufacturing_packing_date",
    "mfd_date": "manufacturing_packing_date",
    "expiry_or_use_by_date": "best_before_expiry",
    "expiry": "best_before_expiry",
    "mrp_inclusive_of_taxes": "mrp",
    "consumer_care_contact": "consumer_care_details",
    "customer_care": "consumer_care_details"
}


def normalize_field_name(field_name: str) -> str:
    """Map any field alias to its canonical field name."""
    clean_name = field_name.strip().lower()
    return FIELD_ALIASES.get(clean_name, clean_name)


@dataclass
class NormalizedValue:
    """Represents machine-readable normalized value while preserving raw evidence."""
    raw_text: str
    normalized_value: Optional[Union[Dict[str, Any], float, int, str]] = None
    normalization_status: str = NormalizationStatus.UNTOUCHED.value
    extra_info: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "raw_text": self.raw_text,
            "normalized_value": self.normalized_value,
            "normalization_status": self.normalization_status,
            "extra_info": self.extra_info
        }


@dataclass
class FieldCandidate:
    """Represents a generated candidate region/segment for a field."""
    candidate_id: str
    field_name: str
    raw_text: str
    raw_value: str
    source_region_ids: List[str]
    source_bbox: Optional[List[int]] = None
    score: float = 0.0
    evidence_types: List[str] = field(default_factory=list)
    parsed_value: Optional[Any] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "candidate_id": self.candidate_id,
            "field_name": self.field_name,
            "raw_text": self.raw_text,
            "raw_value": self.raw_value,
            "source_region_ids": self.source_region_ids,
            "source_bbox": self.source_bbox,
            "score": round(self.score, 4),
            "evidence_types": self.evidence_types,
            "parsed_value": self.parsed_value
        }


@dataclass
class ExtractedField:
    """Represents a single extracted legal field with evidence linking & candidate list."""
    field_name: str
    raw_text: str = ""
    raw_value: str = ""
    normalized_value: Optional[NormalizedValue] = None
    source_region_ids: List[str] = field(default_factory=list)
    source_text: str = ""
    source_bbox: Optional[List[int]] = None
    extraction_confidence: Optional[float] = None
    status: str = FieldStatus.NOT_FOUND.value
    candidates: List[FieldCandidate] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "field_name": self.field_name,
            "raw_text": self.raw_text,
            "raw_value": self.raw_value,
            "normalized_value": self.normalized_value.to_dict() if self.normalized_value else None,
            "source_region_ids": self.source_region_ids,
            "source_text": self.source_text,
            "source_bbox": self.source_bbox,
            "extraction_confidence": self.extraction_confidence,
            "status": self.status,
            "candidates": [c.to_dict() for c in self.candidates]
        }


@dataclass
class ExtractionSourceMetadata:
    """Source provenance metadata for extraction results."""
    ocr_engine: str = "rapidocr"
    ocr_version: str = "1.2.3"
    preprocessing_version: str = "1.0.0"
    extraction_version: str = "1.0.0"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ocr_engine": self.ocr_engine,
            "ocr_version": self.ocr_version,
            "preprocessing_version": self.preprocessing_version,
            "extraction_version": self.extraction_version
        }


@dataclass
class ProductFacts:
    """Top-level structured facts payload returned by Phase 4."""
    product_id: str
    status: str = "SUCCESS"  # SUCCESS, PARTIAL, FAILED
    fields: Dict[str, ExtractedField] = field(default_factory=dict)
    source: ExtractionSourceMetadata = field(default_factory=ExtractionSourceMetadata)
    execution_time_ms: float = 0.0
    errors: List[Dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "product_id": self.product_id,
            "status": self.status,
            "fields": {k: v.to_dict() for k, v in self.fields.items()},
            "source": self.source.to_dict(),
            "execution_time_ms": round(self.execution_time_ms, 2),
            "errors": self.errors
        }
