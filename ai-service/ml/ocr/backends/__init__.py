"""
OCR Backends Package
Contains OCR engine wrapper implementations (RapidOCR, EasyOCR, PyTesseract).
"""

from .rapidocr_backend import RapidOCRBackend
from .easyocr_backend import EasyOCRBackend
from .pytesseract_backend import PyTesseractBackend

__all__ = ["RapidOCRBackend", "EasyOCRBackend", "PyTesseractBackend"]
