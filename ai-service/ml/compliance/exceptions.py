"""
Phase 6 Legal Metrology Compliance Exceptions
Custom exception classes for rule loading, registry management, applicability, field validation, and compliance pipeline execution.
"""

class ComplianceEngineError(Exception):
    """Base exception for all legal metrology compliance failures."""
    pass


class RuleSchemaError(ComplianceEngineError):
    """Raised when a legal rule definition violates schema specifications."""
    pass


class RuleRegistryError(ComplianceEngineError):
    """Raised when rule registry lookup or versioning encounters an error."""
    pass


class ApplicabilityError(ComplianceEngineError):
    """Raised when rule applicability evaluation fails."""
    pass


class ValidationError(ComplianceEngineError):
    """Raised when field validation fails critically."""
    pass
