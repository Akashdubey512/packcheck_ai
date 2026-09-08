"""
Custom Exception Classes for OCR Subsystem
"""

class OCRError(Exception):
    """Base exception for all OCR errors."""
    pass

class OCREngineError(OCRError):
    """Raised when an OCR engine fails to initialize or execute."""
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message

class OCRContractViolationError(OCRError):
    """Raised when OCR output violates ML_CONTRACT.md schema."""
    pass

class OCRBatchError(OCRError):
    """Raised during batch processing failures."""
    pass
