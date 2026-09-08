"""
Multi-View Product Inspection Subsystem
Handles multi-image packaging sessions, face classification, candidate fusion, cross-view contradiction detection,
and unified product compliance aggregation.
"""

from .types import (
    PackageViewType,
    CoverageStatus,
    InspectionSession,
    ViewPackageResult,
    CrossViewFact,
    ContradictionItem,
    MultiViewInspectionResult
)
from .session import MultiViewSessionManager
from .view_classifier import classify_package_view
from .cross_view_fusion import fuse_cross_view_candidates
from .inspection_pipeline import MultiViewInspectionPipeline

__all__ = [
    "PackageViewType",
    "CoverageStatus",
    "InspectionSession",
    "ViewPackageResult",
    "CrossViewFact",
    "ContradictionItem",
    "MultiViewInspectionResult",
    "MultiViewSessionManager",
    "classify_package_view",
    "fuse_cross_view_candidates",
    "MultiViewInspectionPipeline"
]
