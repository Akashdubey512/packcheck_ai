"""
Phase 5 Confidence & Evidence Exceptions
Custom exception classes for confidence scoring, calibration, evidence cropping, and provenance tracking.
"""

class ConfidenceEngineError(Exception):
    """Base exception for all confidence engine failures."""
    pass


class CalibrationError(ConfidenceEngineError):
    """Raised when confidence calibration encounters an unrecoverable error."""
    pass


class EvidenceCropError(ConfidenceEngineError):
    """Raised when evidence cropping fails."""
    pass


class ProvenanceError(ConfidenceEngineError):
    """Raised when SHA-256 provenance calculation fails."""
    pass
