"""
Multi-View Inspection Session Manager
Tracks inspection sessions and manages multi-view package image uploads.
"""

import time
import uuid
from typing import Dict, Any, List, Optional
from .types import InspectionSession, ViewPackageResult, CoverageStatus

class MultiViewSessionManager:
    """Manages multi-view packaging inspection sessions."""

    def __init__(self):
        self.sessions: Dict[str, InspectionSession] = {}

    def create_session(self, inspection_id: Optional[str] = None) -> InspectionSession:
        if not inspection_id:
            inspection_id = f"INSP_{uuid.uuid4().hex[:8].upper()}"
        session = InspectionSession(
            inspection_id=inspection_id,
            created_at=time.strftime("%Y-%m-%d %H:%M:%S")
        )
        self.sessions[inspection_id] = session
        return session

    def add_view(self, inspection_id: str, view_result: ViewPackageResult) -> InspectionSession:
        if inspection_id not in self.sessions:
            self.create_session(inspection_id)
        session = self.sessions[inspection_id]
        session.views.append(view_result)
        session.inspected_views.append(view_result.view_type)
        return session

    def get_session(self, inspection_id: str) -> Optional[InspectionSession]:
        return self.sessions.get(inspection_id)
