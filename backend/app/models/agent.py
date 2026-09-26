"""
Agent State and Mission Execution Models for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Manages the lifecycle of missions, steps, execution plans,
and metrics streamed in real-time to the UI via Server-Sent Events (SSE).
"""

from enum import Enum
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.models.capability import ToolHealth
from app.models.provenance import ProvenanceMetadata

class LoopPhase(str, Enum):
    SENSE = "SENSE"
    UNDERSTAND = "UNDERSTAND"
    DECIDE = "DECIDE"
    ACT = "ACT"
    CHECK = "CHECK"
    RECOVER = "RECOVER"
    REPLAN = "REPLAN"

class StepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

class MissionStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING_HUMAN = "waiting_human"

class Step(BaseModel):
    id: str = Field(..., description="Unique step identifier")
    index: int = Field(..., description="Zero-based execution order index")
    description: str = Field(..., description="Human and machine readable goal of this step")
    tool: str = Field(..., description="Target tool name to invoke")
    params: Dict[str, Any] = Field(default_factory=dict, description="Input parameters passed to the tool")
    status: StepStatus = Field(StepStatus.PENDING, description="Execution status of the step")
    output: Optional[Dict[str, Any]] = Field(None, description="Output payload produced by tool execution")
    error: Optional[str] = Field(None, description="Error message if execution failed")
    provenance: Optional[ProvenanceMetadata] = Field(None, description="Data lineage, trust score, and freshness")
    execution_time_ms: Optional[float] = Field(None, description="Execution duration in milliseconds")
    retry_count: int = Field(0, description="Number of retry attempts made for this step")

class Mission(BaseModel):
    id: str = Field(..., description="Unique mission identifier")
    objective: str = Field(..., description="High-level mission objective")
    status: MissionStatus = Field(MissionStatus.IDLE, description="Current mission operational status")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Metrics(BaseModel):
    steps_executed: int = Field(0, description="Total steps successfully completed")
    replans_count: int = Field(0, description="Number of dynamic plan regenerations triggered")
    tool_failures: int = Field(0, description="Number of tool execution failures intercepted")
    cache_hits: int = Field(0, description="Number of times local fallback or cached data was utilized")
    current_loop_phase: LoopPhase = Field(LoopPhase.SENSE, description="Current phase in the SENSE-REPLAN-ACT loop")

class AgentState(BaseModel):
    mission: Optional[Mission] = Field(None, description="Active mission metadata")
    plan: List[Step] = Field(default_factory=list, description="Array of ordered execution steps")
    capabilities: Dict[str, ToolHealth] = Field(default_factory=dict, description="Current tool health status map")
    metrics: Metrics = Field(default_factory=Metrics, description="Operational performance and resilience counters")
    active_chaos: List[Dict[str, Any]] = Field(default_factory=list, description="Active deterministic chaos rules")
    pending_human_request: Optional[Dict[str, Any]] = Field(None, description="Active human handoff prompt if paused at Safety Gate")

class MissionCreateRequest(BaseModel):
    objective: str = Field(..., min_length=3, description="Goal to be planned and executed by Gemma 4")

class HumanResponseRequest(BaseModel):
    mission_id: str
    step_id: str
    action: str = Field(..., description="'approve', 'override', or 'abort'")
    override_data: Optional[Dict[str, Any]] = None
