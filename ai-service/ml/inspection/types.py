"""
Multi-View Data Models & Schemas
Defines structured classes for multi-image packaging inspections.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional

class PackageViewType(str, Enum):
    FRONT = "FRONT"
    BACK = "BACK"
    SIDE_LEFT = "SIDE_LEFT"
    SIDE_RIGHT = "SIDE_RIGHT"
    TOP = "TOP"
    BOTTOM = "BOTTOM"
    UNKNOWN = "UNKNOWN"

class CoverageStatus(str, Enum):
    FULL_COVERAGE = "FULL_COVERAGE"
    PARTIAL_COVERAGE = "PARTIAL_COVERAGE"
    INSUFFICIENT_COVERAGE = "INSUFFICIENT_COVERAGE"
    UNKNOWN_COVERAGE = "UNKNOWN_COVERAGE"
    COMPLETE = "FULL_COVERAGE"
    PARTIAL = "PARTIAL_COVERAGE"
    UNKNOWN = "UNKNOWN_COVERAGE"

@dataclass
class ContradictionItem:
    field_name: str
    view_a: str
    value_a: str
    view_b: str
    value_b: str
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "field_name": self.field_name,
            "view_a": self.view_a,
            "value_a": self.value_a,
            "view_b": self.view_b,
            "value_b": self.value_b,
            "description": self.description
        }

@dataclass
class ViewPackageResult:
    view_id: str
    image_id: str
    view_type: str
    quality_status: str
    extracted_fields: Dict[str, Any]
    evidence_crops: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "view_id": self.view_id,
            "image_id": self.image_id,
            "view_type": self.view_type,
            "quality_status": self.quality_status,
            "extracted_fields": self.extracted_fields,
            "evidence_crops": self.evidence_crops
        }

@dataclass
class CrossViewFact:
    field_name: str
    consensus_value: Optional[Any]
    candidate_sources: List[Dict[str, Any]]
    is_contradictory: bool = False
    confidence: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "field_name": self.field_name,
            "consensus_value": self.consensus_value,
            "candidate_sources": self.candidate_sources,
            "is_contradictory": self.is_contradictory,
            "confidence": round(self.confidence, 4)
        }

@dataclass
class InspectionSession:
    inspection_id: str
    created_at: str
    views: List[ViewPackageResult] = field(default_factory=list)
    coverage_status: str = CoverageStatus.UNKNOWN.value
    inspected_views: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "inspection_id": self.inspection_id,
            "created_at": self.created_at,
            "views": [v.to_dict() for v in self.views],
            "coverage_status": self.coverage_status,
            "inspected_views": self.inspected_views
        }

@dataclass
class MultiViewInspectionResult:
    inspection_id: str
    overall_status: str
    coverage: Dict[str, Any]
    unified_facts: Dict[str, Any]
    contradictions: List[ContradictionItem]
    compliance_result: Dict[str, Any]
    views_analyzed: int
    execution_time_ms: float
    ocr: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "inspection_id": self.inspection_id,
            "overall_status": self.overall_status,
            "coverage": self.coverage,
            "unified_facts": self.unified_facts,
            "contradictions": [c.to_dict() for c in self.contradictions],
            "compliance_result": self.compliance_result,
            "views_analyzed": self.views_analyzed,
            "execution_time_ms": round(self.execution_time_ms, 2),
            "ocr": self.ocr or {}
        }
