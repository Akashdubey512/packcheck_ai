"""
Abstract Base OCR Engine Interface
Defines standard interface method `detect_and_recognize` for pluggable OCR backends.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Union, Dict, Any, List
import numpy as np
from PIL import Image

from .types import OCRResult, TextRegion, BoundingBox
from .exceptions import OCREngineError

class BaseOCREngine(ABC):
    """Abstract base class for all OCR engine backends."""
    
    def __init__(self, name: str, version: str, languages: List[str] = None):
        self.name = name
        self.version = version
        self.languages = languages or ["en", "hi"]

    @abstractmethod
    def detect_and_recognize(
        self,
        image_input: Union[str, Path, np.ndarray, Image.Image],
        image_id: str = "SAMPLE"
    ) -> OCRResult:
        """
        Detect text bounding boxes and recognize characters in the given image.
        Must return structured OCRResult object.
        """
        pass
