"""
OCR Data Types & Schemas
Dataclasses representing bounding boxes, text regions, and unified OCR results.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple

class OCRErrorStatus(str, Enum):
    OCR_SUCCESS = "OCR_SUCCESS"
    OCR_PARTIAL = "OCR_PARTIAL"
    OCR_NO_TEXT = "OCR_NO_TEXT"
    OCR_LOW_QUALITY = "OCR_LOW_QUALITY"
    OCR_ENGINE_ERROR = "OCR_ENGINE_ERROR"
    OCR_FAILED = "OCR_FAILED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


@dataclass
class BoundingBox:
    """Bounding box representation [x1, y1, x2, y2]."""
    x1: int
    y1: int
    x2: int
    y2: int

    @property
    def width(self) -> int:
        return max(0, self.x2 - self.x1)

    @property
    def height(self) -> int:
        return max(0, self.y2 - self.y1)

    @property
    def area(self) -> int:
        return self.width * self.height

    @property
    def center(self) -> Tuple[float, float]:
        return ((self.x1 + self.x2) / 2.0, (self.y1 + self.y2) / 2.0)

    def to_list(self) -> List[int]:
        return [self.x1, self.y1, self.x2, self.y2]

    @classmethod
    def from_list(cls, coords: List[int]) -> "BoundingBox":
        if len(coords) != 4:
            raise ValueError(f"BoundingBox requires 4 coordinates, got {coords}")
        return cls(x1=int(coords[0]), y1=int(coords[1]), x2=int(coords[2]), y2=int(coords[3]))

@dataclass
class TextRegion:
    """Represents a detected and recognized text region."""
    region_id: int
    bbox: BoundingBox
    text: str
    normalized_text: str = ""
    confidence: Optional[float] = None
    polygon: Optional[List[Tuple[int, int]]] = None
    language: Optional[str] = None
    rotation: int = 0
    detector_confidence: Optional[float] = None
    recognizer_confidence: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "region_id": self.region_id,
            "bbox": self.bbox.to_list(),
            "polygon": [list(pt) for pt in self.polygon] if self.polygon else None,
            "text": self.text,
            "normalized_text": self.normalized_text or self.text,
            "confidence": self.confidence,
            "language": self.language,
            "rotation": self.rotation,
            "detector_confidence": self.detector_confidence,
            "recognizer_confidence": self.recognizer_confidence
        }

@dataclass
class OCRResult:
    """Unified OCR Result payload matching ML_CONTRACT.md schema."""
    image_id: str
    engine: str
    engine_version: str
    preprocessing_version: str = "1.0.0"
    dataset_version: str = "1.0.0"
    ocr_version: str = "1.0.0"
    image_width: int = 0
    image_height: int = 0
    status: str = "SUCCESS" # SUCCESS, PARTIAL, FAILED, NO_TEXT, REVIEW_REQUIRED
    regions: List[TextRegion] = field(default_factory=list)
    full_raw_text: str = ""
    full_normalized_text: str = ""
    errors: List[Dict[str, str]] = field(default_factory=list)
    execution_time_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "image_id": self.image_id,
            "ocr_version": self.ocr_version,
            "engine": self.engine,
            "engine_version": self.engine_version,
            "preprocessing_version": self.preprocessing_version,
            "dataset_version": self.dataset_version,
            "image": {
                "width": self.image_width,
                "height": self.image_height
            },
            "status": self.status,
            "regions": [r.to_dict() for r in self.regions],
            "full_raw_text": self.full_raw_text,
            "full_normalized_text": self.full_normalized_text,
            "errors": self.errors,
            "execution_time_ms": self.execution_time_ms
        }
