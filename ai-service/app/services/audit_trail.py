"""
Human Review Audit Log Service
Tracks human auditor review events, overrides, and approvals without overwriting raw AI extraction results.
"""

import time
import uuid
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class AuditEvent:
    audit_event_id: str
    inspection_id: str
    field_name: str
    user_role: str
    old_value: Optional[Any]
    new_value: Any
    reason: str
    timestamp: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "audit_event_id": self.audit_event_id,
            "inspection_id": self.inspection_id,
            "field_name": self.field_name,
            "user_role": self.user_role,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "reason": self.reason,
            "timestamp": self.timestamp
        }

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
AUDIT_LOG_DIR = BASE_DIR / "processed_data" / "audit_logs"

class AuditTrailService:
    """Manages audit log events for human officer review with persistent disk storage."""

    def __init__(self, log_dir: Path = AUDIT_LOG_DIR):
        self.log_dir = log_dir
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def log_override(
        self,
        inspection_id: str,
        field_name: str,
        old_value: Any,
        new_value: Any,
        reason: str,
        user_role: str = "LEGAL_METROLOGY_OFFICER"
    ) -> AuditEvent:
        event = AuditEvent(
            audit_event_id=f"AUD_{uuid.uuid4().hex[:8].upper()}",
            inspection_id=inspection_id,
            field_name=field_name,
            user_role=user_role,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        # Save event append-only to JSON file
        file_path = self.log_dir / f"{inspection_id}_audit.json"
        existing = self.get_events(inspection_id)
        existing.append(event.to_dict())

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)

        return event

    def get_events(self, inspection_id: str) -> List[Dict[str, Any]]:
        file_path = self.log_dir / f"{inspection_id}_audit.json"
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return []
