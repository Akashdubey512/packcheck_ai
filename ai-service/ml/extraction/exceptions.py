"""
Phase 4 Extraction Exceptions
Custom exception classes for candidate generation, classification, field extraction, and value normalization.
"""

class ExtractionError(Exception):
    """Base exception for all field extraction failures."""
    pass


class InvalidFieldError(ExtractionError):
    """Raised when an unsupported or invalid field name is specified."""
    pass


class NormalizationError(ExtractionError):
    """Raised when value normalization fails critically."""
    pass


class CandidateGenerationError(ExtractionError):
    """Raised when candidate generation encounters an unrecoverable issue."""
    pass
