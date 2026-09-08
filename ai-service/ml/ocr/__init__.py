"""
ML OCR Package
Legal Metrology (Packaged Commodities) Compliance Auditor - SIH 2026
"""

from .types import BoundingBox, TextRegion, OCRResult
from .exceptions import OCRError, OCREngineError, OCRContractViolationError, OCRBatchError
from .base import BaseOCREngine
from .engine import get_ocr_engine
from .normalizer import normalize_ocr_text
from .reading_order import sort_reading_order
from .region_merger import merge_nearby_regions
from .pipeline import FullOCRPipeline

__all__ = [
    "BoundingBox",
    "TextRegion",
    "OCRResult",
    "OCRError",
    "OCREngineError",
    "OCRContractViolationError",
    "OCRBatchError",
    "BaseOCREngine",
    "get_ocr_engine",
    "normalize_ocr_text",
    "sort_reading_order",
    "merge_nearby_regions",
    "FullOCRPipeline"
]
