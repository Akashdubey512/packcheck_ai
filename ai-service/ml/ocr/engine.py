"""
OCR Engine Factory & Dispatcher
Dynamically instantiates requested OCR backend (rapidocr, easyocr, pytesseract) with fallback support.
"""

from typing import List, Optional
from .base import BaseOCREngine
from .exceptions import OCREngineError
from .backends import RapidOCRBackend, EasyOCRBackend, PyTesseractBackend

BACKEND_MAP = {
    "rapidocr": RapidOCRBackend,
    "easyocr": EasyOCRBackend,
    "pytesseract": PyTesseractBackend
}

_ENGINE_CACHE = {}

def get_ocr_engine(
    backend_name: str = "rapidocr",
    languages: Optional[List[str]] = None,
    fallback_backends: Optional[List[str]] = None
) -> BaseOCREngine:
    """
    Factory function to instantiate OCR engine backend with Singleton caching.
    
    Reuses model sessions across requests to eliminate cold-start ONNX loading latency.
    """
    backend_key = backend_name.lower().strip()
    languages = languages or ["en", "hi"]
    cache_key = f"{backend_key}_{'-'.join(sorted(languages))}"

    if cache_key in _ENGINE_CACHE:
        return _ENGINE_CACHE[cache_key]

    fallback_backends = fallback_backends or ["easyocr", "pytesseract"]

    # Try primary backend
    if backend_key in BACKEND_MAP:
        try:
            engine_inst = BACKEND_MAP[backend_key](languages=languages)
            _ENGINE_CACHE[cache_key] = engine_inst
            return engine_inst
        except Exception as primary_err:
            print(f"Primary OCR engine '{backend_key}' initialization failed: {primary_err}")
            
    # Try fallbacks
    for fb in fallback_backends:
        fb_key = fb.lower().strip()
        if fb_key in BACKEND_MAP and fb_key != backend_key:
            try:
                print(f"Attempting fallback OCR engine '{fb_key}'...")
                engine_inst = BACKEND_MAP[fb_key](languages=languages)
                _ENGINE_CACHE[cache_key] = engine_inst
                return engine_inst
            except Exception:
                continue

    raise OCREngineError("ALL_BACKENDS_FAILED", f"Unable to initialize primary engine '{backend_name}' or any fallback engine.")
