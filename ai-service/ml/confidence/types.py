"""
Phase 5 Data Types & Schemas
Defines dataclasses, confidence breakdowns, evidence manifests, input provenance, and audited product facts.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional, Union


class ConfidenceStatus(str, Enum):
    """Explicit confidence & uncertainty statuses as per Phase 5 requirements."""
    CONFIDENT = "CONFIDENT"
    UNCERTAIN = "UNCERTAIN"
    AMBIGUOUS = "AMBIGUOUS"
    CONTRADICTORY = "CONTRADICTORY"
    LOW_QUALITY_EVIDENCE = "LOW_QUALITY_EVIDENCE"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    UNAVAILABLE = "UNAVAILABLE"


class CalibrationStatus(str, Enum):
    """Explicit calibration availability statuses."""
    UNCALIBRATED = "UNCALIBRATED"
    CALIBRATION_UNAVAILABLE = "CALIBRATION_UNAVAILABLE"
    CALIBRATED_PLATT = "CALIBRATED_PLATT"
    CALIBRATED_ISOTONIC = "CALIBRATED_ISOTONIC"


@dataclass
class ConfidenceBreakdown:
    """Detailed multi-factor confidence breakdown for an extracted field."""
    ocr_confidence: Optional[float] = None
    candidate_score: float = 0.0
    normalization_score: float = 1.0
    image_quality_score: float = 1.0
    consistency_score: float = 1.0
    raw_composite_score: float = 0.0
    calibrated_probability: Optional[float] = None
    calibration_status: str = CalibrationStatus.CALIBRATION_UNAVAILABLE.value

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ocr_confidence": round(self.ocr_confidence, 4) if self.ocr_confidence is not None else None,
            "candidate_score": round(self.candidate_score, 4),
            "normalization_score": round(self.normalization_score, 4),
            "image_quality_score": round(self.image_quality_score, 4),
            "consistency_score": round(self.consistency_score, 4),
            "raw_composite_score": round(self.raw_composite_score, 4),
            "calibrated_probability": round(self.calibrated_probability, 4) if self.calibrated_probability is not None else None,
            "calibration_status": self.calibration_status
        }


@dataclass
class EvidenceCrop:
    """Represents a cropped sub-image region serving as visual evidence for an extracted field."""
    crop_id: str
    field_name: str
    region_id: str
    bbox: List[int]
    image_path: str
    crop_sha256: str
    width: int
    height: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "crop_id": self.crop_id,
            "field_name": self.field_name,
            "region_id": self.region_id,
            "bbox": self.bbox,
            "image_path": self.image_path,
            "crop_sha256": self.crop_sha256,
            "width": self.width,
            "height": self.height
        }


@dataclass
class EvidenceManifest:
    """Comprehensive evidence manifest linking visual crops, bounding boxes, and raw OCR text."""
    manifest_id: str
    product_id: str
    crops: List[EvidenceCrop] = field(default_factory=list)
    source_text_map: Dict[str, str] = field(default_factory=dict)
    source_bbox_map: Dict[str, List[int]] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "manifest_id": self.manifest_id,
            "product_id": self.product_id,
            "crops": [c.to_dict() for c in self.crops],
            "source_text_map": self.source_text_map,
            "source_bbox_map": self.source_bbox_map
        }


@dataclass
class InputProvenance:
    """Cryptographic provenance and pipeline component versioning manifest."""
    input_sha256: str
    dataset_version: str = "1.0.0"
    preprocessing_version: str = "1.0.0"
    ocr_engine: str = "rapidocr"
    ocr_version: str = "1.2.3"
    extraction_version: str = "1.0.0"
    confidence_version: str = "1.0.0"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "input_sha256": self.input_sha256,
            "dataset_version": self.dataset_version,
            "preprocessing_version": self.preprocessing_version,
            "ocr_engine": self.ocr_engine,
            "ocr_version": self.ocr_version,
            "extraction_version": self.extraction_version,
            "confidence_version": self.confidence_version
        }


@dataclass
class FieldExplanation:
    """Human-readable explanation of confidence scoring, candidate selection, and uncertainty."""
    field_name: str
    status: str
    summary: str
    reasons: List[str] = field(default_factory=list)
    candidate_comparison: Optional[List[Dict[str, Any]]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "field_name": self.field_name,
            "status": self.status,
            "summary": self.summary,
            "reasons": self.reasons,
            "candidate_comparison": self.candidate_comparison
        }


@dataclass
class AuditedField:
    """Represents a fully audited legal field with confidence scoring, evidence crops, and explanation."""
    field_name: str
    raw_text: str = ""
    raw_value: str = ""
    normalized_value: Optional[Dict[str, Any]] = None
    status: str = ConfidenceStatus.UNAVAILABLE.value
    confidence: ConfidenceBreakdown = field(default_factory=ConfidenceBreakdown)
    evidence_crop_ids: List[str] = field(default_factory=list)
    source_region_ids: List[str] = field(default_factory=list)
    source_bbox: Optional[List[int]] = None
    explanation: FieldExplanation = field(default_factory=lambda: FieldExplanation(field_name="", status="", summary=""))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "field_name": self.field_name,
            "raw_text": self.raw_text,
            "raw_value": self.raw_value,
            "normalized_value": self.normalized_value,
            "status": self.status,
            "confidence": self.confidence.to_dict(),
            "evidence_crop_ids": self.evidence_crop_ids,
            "source_region_ids": self.source_region_ids,
            "source_bbox": self.source_bbox,
            "explanation": self.explanation.to_dict()
        }


@dataclass
class AuditedProductFacts:
    """Top-level Phase 5 audited product facts payload with complete evidence linking & provenance."""
    product_id: str
    status: str = "SUCCESS"  # SUCCESS, PARTIAL, FAILED
    fields: Dict[str, AuditedField] = field(default_factory=dict)
    evidence_manifest: EvidenceManifest = field(default_factory=lambda: EvidenceManifest(manifest_id="", product_id=""))
    provenance: InputProvenance = field(default_factory=lambda: InputProvenance(input_sha256=""))
    execution_time_ms: float = 0.0
    errors: List[Dict[str, str]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "product_id": self.product_id,
            "status": self.status,
            "fields": {k: v.to_dict() for k, v in self.fields.items()},
            "evidence_manifest": self.evidence_manifest.to_dict(),
            "provenance": self.provenance.to_dict(),
            "execution_time_ms": round(self.execution_time_ms, 2),
            "errors": self.errors
        }
