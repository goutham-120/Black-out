"""
FastAPI Main Application and API Contract Endpoints for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Serves as the central communication nexus for the agent:
delivers real-time state via Server-Sent Events (SSE) and handles mission dispatch,
deterministic chaos injection, and human-in-the-loop safety approvals.
"""

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.database.connection import init_database
from app.database.repository import Repository
from app.models.agent import (
    AgentState,
    MissionCreateRequest,
    HumanResponseRequest,
)
from app.models.chaos import ChaosPayload, ChaosRule
from app.events.broadcaster import broadcaster
from app.engines.agent_loop import agent_loop
from app.engines.capability_engine import capability_engine
from app.engines.chaos_switchboard import chaos_switchboard

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("blackout.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing BLACKOUT resilient backend...")
    init_database()
    await capability_engine.probe_all()
    await capability_engine.start_background_probing()
    # Crash resilience: resume any mission interrupted by SIGKILL
    await agent_loop.resume_interrupted_missions()
    yield
    # Shutdown sequence
    logger.info("Shutting down BLACKOUT backend services...")
    await capability_engine.stop_background_probing()

app = FastAPI(
    title=settings.APP_NAME,
    description="BLACKOUT: Local-first autonomous agent demonstrating extreme environmental resilience with Gemma 4.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint indicating API readiness."""
    return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0"}

@app.get("/agent/stream")
async def agent_stream(request: Request):
    """
    Native Server-Sent Events (SSE) state stream conforming strictly to API Contract.
    Continuously pushes unified AgentState (mission, plan, capabilities, metrics).
    """
    queue = await broadcaster.subscribe()

    async def event_generator() -> AsyncGenerator[dict, None]:
        try:
            # Yield initial snapshot immediately upon client connection
            initial_state = agent_loop.get_current_state()
            yield {
                "event": "agent_state",
                "data": initial_state.model_dump_json(),
            }

            while True:
                # Check for client disconnection
                if await request.is_disconnected():
                    break

                try:
                    # Wait for next broadcast message or send periodic keep-alive
                    msg = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield msg
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat ping
                    yield {"event": "ping", "data": json.dumps({"status": "alive"})}

        except asyncio.CancelledError:
            pass
        finally:
            await broadcaster.unsubscribe(queue)

    return EventSourceResponse(event_generator())

@app.get("/agent/state", response_model=AgentState)
async def get_state():
    """Direct REST snapshot of the current unified agent state."""
    return agent_loop.get_current_state()

@app.post("/agent/mission")
async def start_mission(payload: MissionCreateRequest):
    """Triggers an autonomous mission objective to be planned and executed by Gemma 4."""
    mission = await agent_loop.start_mission(payload.objective)
    return {"message": "Mission started", "mission": mission}

@app.post("/agent/chaos")
async def trigger_chaos(payload: ChaosPayload):
    """
    Deterministic fault injection trigger.
    Accepts: { "target": string, "action": string, "intensity": float }
    """
    rule = await chaos_switchboard.inject_chaos(payload)
    # Immediately re-probe capabilities and push updated state
    await capability_engine.probe_all()
    state = agent_loop.get_current_state()
    await broadcaster.broadcast_state(state)
    return {"message": "Chaos directive applied", "rule": rule}

@app.get("/agent/chaos")
async def list_active_chaos():
    """Lists all active deterministic chaos rules."""
    return {"active_rules": chaos_switchboard.get_active_rules()}

@app.post("/agent/chaos/clear")
async def clear_all_chaos():
    """Removes all active chaos rules and restores subsystems to nominal state."""
    Repository.clear_all_chaos()
    chaos_switchboard._rules.clear()
    await capability_engine.probe_all()
    state = agent_loop.get_current_state()
    await broadcaster.broadcast_state(state)
    return {"message": "All chaos rules cleared and subsystems restored."}

@app.post("/agent/human-response")
async def submit_human_response(payload: HumanResponseRequest):
    """Submits human authorization or data override when agent is halted at the Safety Gate."""
    success = agent_loop.handle_human_input(payload)
    if not success:
        raise HTTPException(status_code=400, detail="No active human handoff request pending.")
    return {"message": "Human response accepted", "action": payload.action}

@app.get("/agent/capabilities")
async def get_capabilities():
    """Returns real-time health and latency metrics for all probed tools."""
    return {"capabilities": capability_engine.get_current_capabilities()}

@app.get("/agent/audit-logs")
async def get_audit_logs(limit: int = 50):
    """Retrieves the recent persistent audit trail from the SQLite WAL store."""
    from app.database.connection import get_db_connection
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, mission_id, phase, event_type, message, metadata, created_at
            FROM audit_logs
            ORDER BY id DESC LIMIT ?;
            """,
            (limit,)
        )
        rows = cur.fetchall()
        return {
            "logs": [
                {
                    "id": r["id"],
                    "mission_id": r["mission_id"],
                    "phase": r["phase"],
                    "event_type": r["event_type"],
                    "message": r["message"],
                    "metadata": json.loads(r["metadata"]) if r["metadata"] else None,
                    "created_at": r["created_at"],
                }
                for r in rows
            ]
        }
