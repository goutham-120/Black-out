"""
Chaos Switchboard Models for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Defines deterministic fault-injection instructions
that intercept tool execution during the ACT and CHECK phases.
"""

from typing import Optional
from pydantic import BaseModel, Field

class ChaosPayload(BaseModel):
    target: str = Field(..., description="Target subsystem or tool (e.g., 'internet', 'weather_api', 'calendar', 'filesystem', 'local_cache')")
    action: str = Field(..., description="Chaos action to inject: 'kill', 'latency', 'corrupt', 'stale', 'restore'")
    intensity: float = Field(1.0, ge=0.0, le=1.0, description="Intensity of failure or drop probability (0.0 to 1.0)")
    duration_seconds: Optional[float] = Field(None, description="Optional time limit in seconds after which rule auto-expires")

class ChaosRule(BaseModel):
    id: str
    target: str
    action: str
    intensity: float = 1.0
    active: bool = True
    created_at: str
