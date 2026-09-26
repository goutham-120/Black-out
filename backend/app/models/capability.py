"""
Capability Engine Data Models for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Captures the runtime health and status of all external
and internal tools during the SENSE phase before the agent commits to a DECIDE or ACT step.
"""

from enum import Enum
from datetime import datetime, timezone
from typing import Dict, Optional, Any
from pydantic import BaseModel, Field

class CapabilityState(str, Enum):
    AVAILABLE = "AVAILABLE"
    DEGRADED = "DEGRADED"
    STALE = "STALE"
    UNAVAILABLE = "UNAVAILABLE"

class ToolHealth(BaseModel):
    tool_name: str = Field(..., description="Unique identifier of the tool")
    state: CapabilityState = Field(CapabilityState.AVAILABLE, description="Current operational state")
    latency_ms: float = Field(0.0, description="Response time of the last health probe in milliseconds")
    last_check: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of the most recent probe")
    error_message: Optional[str] = Field(None, description="Detailed diagnostic or error message if degraded or unavailable")
    details: Dict[str, Any] = Field(default_factory=dict, description="Metadata such as cache age, file size, or connectivity stats")

class CapabilitiesMap(BaseModel):
    tools: Dict[str, ToolHealth] = Field(default_factory=dict, description="Dictionary mapping tool names to their current health")
