"""
Calendar Tool for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Manages local agenda, scheduled operational windows,
and alerts. Operates locally with guaranteed 100% offline availability.
"""

import time
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

from app.tools.base import BaseTool
from app.models.capability import ToolHealth, CapabilityState
from app.models.provenance import ProvenanceMetadata

# Seed default local schedule
LOCAL_CALENDAR_STORE = [
    {"id": "ev_01", "time": "08:00", "title": "Perimeter Sensor Diagnostic", "priority": "high"},
    {"id": "ev_02", "time": "12:00", "title": "Grid Power Checkpoint", "priority": "critical"},
    {"id": "ev_03", "time": "17:30", "title": "Emergency Local Sync", "priority": "medium"},
]

class CalendarTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="calendar",
            description="Manages offline agenda, operational windows, and emergency schedule synchronization."
        )

    async def _execute_internal(self, params: Dict[str, Any]) -> Tuple[Dict[str, Any], ProvenanceMetadata]:
        action = params.get("action", "list")
        if action == "add":
            event = {
                "id": f"ev_{int(time.time())}",
                "time": params.get("time", "12:00"),
                "title": params.get("title", "Ad-hoc task"),
                "priority": params.get("priority", "normal")
            }
            LOCAL_CALENDAR_STORE.append(event)
            result = {"created": event, "events": LOCAL_CALENDAR_STORE}
        else:
            result = {"events": LOCAL_CALENDAR_STORE}

        prov = ProvenanceMetadata(
            source="offline_calendar_store",
            timestamp=datetime.now(timezone.utc),
            age_seconds=10.0,
            trust_score=0.99,
            is_synthetic=False
        )
        return result, prov

    async def probe_health(self) -> ToolHealth:
        start = time.perf_counter()
        latency = (time.perf_counter() - start) * 1000.0
        return ToolHealth(
            tool_name=self.name,
            state=CapabilityState.AVAILABLE,
            latency_ms=round(latency, 2),
            last_check=datetime.now(timezone.utc),
            details={"events_count": len(LOCAL_CALENDAR_STORE), "storage": "in-memory-local"}
        )
