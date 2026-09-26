"""
Comprehensive Test Suite for BLACKOUT Backend.
Role in SENSE-REPLAN-ACT loop: Validates crash-resilient SQLite WAL persistence,
deterministic Chaos Switchboard interceptions, Strategy Ladder recovery, and Safety Gate provenance.
"""

import asyncio
import os
import tempfile
import pytest
from datetime import datetime, timezone

from app.database.connection import init_database, get_db_connection
from app.database.repository import Repository
from app.models.agent import Mission, Step, MissionStatus, StepStatus, LoopPhase
from app.models.capability import CapabilityState, ToolHealth
from app.models.chaos import ChaosPayload
from app.models.provenance import ProvenanceMetadata
from app.engines.chaos_switchboard import chaos_switchboard
from app.engines.capability_engine import capability_engine
from app.engines.safety_gate import safety_gate
from app.engines.recovery_engine import recovery_engine
from app.tools.registry import tool_registry

@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """Sets up an isolated SQLite test database for each test run."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name
    
    from app.config import settings
    monkeypatch.setattr(settings, "DATABASE_PATH", db_path)
    init_database()
    yield
    try:
        os.remove(db_path)
    except Exception:
        pass

def test_sqlite_wal_persistence():
    """Verifies SQLite WAL journaling mode and mission/step persistence."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("PRAGMA journal_mode;")
        mode = cur.fetchone()[0]
        assert mode.lower() == "wal", f"Expected WAL mode, got {mode}"

    # Verify mission pre-write
    mission = Mission(
        id="test_mis_01",
        objective="Assess blackout impact on emergency telemetry",
        status=MissionStatus.RUNNING,
    )
    Repository.save_mission(mission)

    retrieved = Repository.get_mission("test_mis_01")
    assert retrieved is not None
    assert retrieved.objective == mission.objective
    assert retrieved.status == MissionStatus.RUNNING

    # Verify step pre-execution write
    step = Step(
        id="test_step_01",
        index=0,
        description="Probe external weather api",
        tool="weather_api",
        status=StepStatus.PENDING,
    )
    Repository.save_step_pre_execution("test_mis_01", step)

    steps = Repository.get_mission_steps("test_mis_01")
    assert len(steps) == 1
    assert steps[0].id == "test_step_01"
    assert steps[0].status == StepStatus.PENDING

@pytest.mark.asyncio
async def test_chaos_switchboard_deterministic_kill():
    """Tests deterministic interception and exception raising when a tool is killed."""
    # Inject chaos kill on internet
    await chaos_switchboard.inject_chaos(
        ChaosPayload(target="internet", action="kill", intensity=1.0)
    )

    internet_tool = tool_registry.get_tool("internet")
    assert internet_tool is not None

    with pytest.raises(ConnectionResetError, match="Deterministic Chaos Injection"):
        await internet_tool.execute({}, chaos_switchboard=chaos_switchboard)

    # Heal subsystem
    await chaos_switchboard.inject_chaos(
        ChaosPayload(target="internet", action="restore", intensity=0.0)
    )

@pytest.mark.asyncio
async def test_capability_engine_probes_and_chaos_reflection():
    """Verifies that capability engine reflects active chaos rules into tool health."""
    await chaos_switchboard.inject_chaos(
        ChaosPayload(target="weather_api", action="kill", intensity=1.0)
    )

    caps = await capability_engine.probe_all()
    assert caps["weather_api"].state == CapabilityState.UNAVAILABLE
    assert "Chaos Switchboard" in caps["weather_api"].error_message

    # Restore
    await chaos_switchboard.inject_chaos(
        ChaosPayload(target="weather_api", action="restore", intensity=0.0)
    )

def test_safety_gate_staleness_and_trust():
    """Verifies Safety Gate halts execution when data is excessively stale or trust score is low."""
    # Fresh nominal data
    fresh_prov = ProvenanceMetadata(
        source="sensor",
        timestamp=datetime.now(timezone.utc),
        age_seconds=12.0,
        trust_score=0.95
    )
    result = safety_gate.evaluate(fresh_prov, "Read telemetry")
    assert result.is_safe is True
    assert result.requires_human_approval is False

    # Low trust score data
    untrusted_prov = ProvenanceMetadata(
        source="unverified_peer",
        timestamp=datetime.now(timezone.utc),
        age_seconds=5.0,
        trust_score=0.30
    )
    result_low_trust = safety_gate.evaluate(untrusted_prov, "Critical grid switch")
    assert result_low_trust.is_safe is False
    assert result_low_trust.requires_human_approval is True

    # Stale data
    stale_prov = ProvenanceMetadata(
        source="cached_weather",
        timestamp=datetime.now(timezone.utc),
        age_seconds=4000.0,  # Exceeds 3600s threshold
        trust_score=0.90
    )
    result_stale = safety_gate.evaluate(stale_prov, "Evaluate storm perimeter")
    assert result_stale.is_safe is False
    assert result_stale.requires_human_approval is True

@pytest.mark.asyncio
async def test_recovery_engine_strategy_ladder():
    """Verifies Strategy Ladder steps down from retry to alt-tool / local fallback when tool fails."""
    mission = Mission(
        id="mis_recovery_test",
        objective="Analyze storm telemetry",
        status=MissionStatus.RUNNING
    )
    Repository.save_mission(mission)

    failed_step = Step(
        id="step_fail_01",
        index=0,
        description="Fetch live meteorological report",
        tool="weather_api",
        status=StepStatus.FAILED,
        retry_count=1  # Already retried once
    )

    remaining_steps = [
        Step(
            id="step_pending_02",
            index=1,
            description="Process radar imagery",
            tool="weather_api",
            status=StepStatus.PENDING
        )
    ]

    capabilities = {
        "weather_api": ToolHealth(tool_name="weather_api", state=CapabilityState.UNAVAILABLE),
        "local_cache": ToolHealth(tool_name="local_cache", state=CapabilityState.AVAILABLE),
        "filesystem": ToolHealth(tool_name="filesystem", state=CapabilityState.AVAILABLE),
    }

    strategy, new_steps, handoff = await recovery_engine.handle_failure(
        mission=mission,
        failed_step=failed_step,
        error_message="Connection timed out",
        remaining_steps=remaining_steps,
        capabilities=capabilities
    )

    assert strategy in ["alt_tool", "local_fallback"]
    assert len(new_steps) > 0
    # The new steps should not rely on unavailable weather_api
    for s in new_steps:
        assert s.tool != "weather_api"

if __name__ == "__main__":
    pytest.main(["-v", __file__])
