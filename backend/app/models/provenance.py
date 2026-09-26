"""
Provenance and Data Integrity Models for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Tracks data lineage, freshness, and trust score
to prevent hallucinated or overly stale data from propagating through the DECIDE phase.
"""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class ProvenanceMetadata(BaseModel):
    source: str = Field(..., description="Origin of the data (e.g., 'live_api', 'local_cache', 'filesystem', 'sensor_backup')")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp when data was acquired")
    age_seconds: float = Field(0.0, description="Age of data in seconds at evaluation time")
    trust_score: float = Field(1.0, ge=0.0, le=1.0, description="Confidence rating between 0.0 (untrusted) and 1.0 (verified fresh)")
    is_synthetic: bool = Field(False, description="Whether the data was approximated or interpolated locally")
    checksum: Optional[str] = Field(None, description="Cryptographic SHA256 checksum for local file/cache verification")

class SafetyGateResult(BaseModel):
    is_safe: bool = Field(..., description="True if data meets freshness and trust threshold for mission execution")
    reason: str = Field(..., description="Explanation of safety decision")
    requires_human_approval: bool = Field(False, description="True if stale or degraded data warrants human confirmation")
    suggested_action: str = Field("proceed", description="Recommended action: proceed, fallback, replan, halt")
