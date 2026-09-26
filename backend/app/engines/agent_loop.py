"""
Master Autonomous Agent Loop for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Drives the continuous cycle:
SENSE → UNDERSTAND → DECIDE → ACT → CHECK → RECOVER → REPLAN.
Maintains state in SQLite WAL, logs pre-execution checkpoints, and streams live updates via SSE.
"""

import asyncio
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from app.models.agent import (
    Mission,
    Step,
    MissionStatus,
    StepStatus,
    LoopPhase,
    Metrics,
    AgentState,
    HumanResponseRequest,
)
from app.models.capability import ToolHealth, CapabilityState
from app.database.repository import Repository
from app.tools.registry import tool_registry
from app.engines.capability_engine import capability_engine
from app.engines.chaos_switchboard import chaos_switchboard
from app.engines.safety_gate import safety_gate
from app.engines.recovery_engine import recovery_engine
from app.ai.gemma_client import gemma_client
from app.events.broadcaster import broadcaster

logger = logging.getLogger("blackout.engines.agent_loop")

class AgentLoop:
    def __init__(self):
        self._current_mission: Optional[Mission] = None
        self._current_plan: List[Step] = []
        self._metrics: Metrics = Metrics()
        self._pending_human_request: Optional[Dict[str, Any]] = None
        self._human_response_event: asyncio.Event = asyncio.Event()
        self._human_response_data: Optional[Dict[str, Any]] = None
        self._execution_task: Optional[asyncio.Task] = None
        self._is_running: bool = False

    def get_current_state(self) -> AgentState:
        """Assembles the current unified state payload matching the API contract."""
        active_chaos = [
            {"id": r.id, "target": r.target, "action": r.action, "intensity": r.intensity}
            for r in chaos_switchboard.get_active_rules()
        ]
        return AgentState(
            mission=self._current_mission,
            plan=self._current_plan,
            capabilities=capability_engine.get_current_capabilities(),
            metrics=self._metrics,
            active_chaos=active_chaos,
            pending_human_request=self._pending_human_request,
        )

    async def _publish_state(self, phase: Optional[LoopPhase] = None) -> None:
        """Broadcasts unified agent state snapshot to connected SSE clients."""
        if phase:
            self._metrics.current_loop_phase = phase
        state = self.get_current_state()
        await broadcaster.broadcast_state(state)

    async def start_mission(self, objective: str) -> Mission:
        """Initiates a new autonomous mission."""
        mission_id = f"mis_{uuid.uuid4().hex[:8]}"
        mission = Mission(
            id=mission_id,
            objective=objective,
            status=MissionStatus.RUNNING,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        Repository.save_mission(mission)
        Repository.log_audit(mission.id, "INITIALIZE", "mission_started", f"Started mission: '{objective}'")

        self._current_mission = mission
        self._current_plan = []
        self._metrics = Metrics(current_loop_phase=LoopPhase.SENSE)
        self._pending_human_request = None

        await self._publish_state(LoopPhase.SENSE)

        # Launch execution loop in background task
        self._execution_task = asyncio.create_task(self._run_mission_loop())
        return mission

    async def _run_mission_loop(self) -> None:
        """The core continuous SENSE → UNDERSTAND → DECIDE → ACT → CHECK → RECOVER → REPLAN loop."""
        self._is_running = True
        try:
            mission = self._current_mission
            if not mission:
                return

            # PHASE 1: SENSE - Probe environmental tools & external state
            await self._publish_state(LoopPhase.SENSE)
            capabilities = await capability_engine.probe_all()

            # PHASE 2: UNDERSTAND - Synthesize environment & objectives
            await self._publish_state(LoopPhase.UNDERSTAND)
            await asyncio.sleep(0.3)  # Perceptual processing window

            # PHASE 3: DECIDE - Generate execution plan via Gemma 4 if starting fresh
            if not self._current_plan:
                await self._publish_state(LoopPhase.DECIDE)
                gemma_plan = await gemma_client.generate_plan(mission.objective, capabilities)
                
                initial_steps = []
                for i, g_step in enumerate(gemma_plan.steps):
                    initial_steps.append(
                        Step(
                            id=f"step_{i+1}_{uuid.uuid4().hex[:4]}",
                            index=i,
                            description=g_step.description,
                            tool=g_step.tool,
                            params=g_step.params,
                            status=StepStatus.PENDING,
                        )
                    )
                self._current_plan = initial_steps
                Repository.save_initial_plan(mission.id, initial_steps)
                await self._publish_state(LoopPhase.DECIDE)

            # Execution loop over steps
            while self._is_running:
                # Find next pending step
                pending_steps = [s for s in self._current_plan if s.status == StepStatus.PENDING]
                if not pending_steps:
                    # All steps completed
                    mission.status = MissionStatus.COMPLETED
                    mission.updated_at = datetime.now(timezone.utc)
                    Repository.update_mission_status(mission.id, MissionStatus.COMPLETED)
                    Repository.log_audit(mission.id, "DECIDE", "mission_completed", "All steps successfully executed.")
                    await self._publish_state(LoopPhase.DECIDE)
                    logger.info(f"Mission [{mission.id}] successfully completed.")
                    break

                current_step = pending_steps[0]
                remaining_steps = pending_steps[1:]

                # PHASE 4: ACT - Execute step with Pre-execution WAL checkpoint
                await self._publish_state(LoopPhase.ACT)
                current_step.status = StepStatus.RUNNING
                
                # CRITICAL: Pre-execution journal write to SQLite WAL before invoking tool
                Repository.save_step_pre_execution(mission.id, current_step)
                await self._publish_state(LoopPhase.ACT)

                tool_instance = tool_registry.get_tool(current_step.tool)
                step_error: Optional[str] = None
                step_output: Optional[Dict[str, Any]] = None
                step_prov: Optional[Any] = None
                start_time = time.perf_counter()

                try:
                    if not tool_instance:
                        raise ValueError(f"Tool '{current_step.tool}' not found in registry.")

                    step_output, step_prov = await tool_instance.execute(
                        params=current_step.params,
                        chaos_switchboard=chaos_switchboard
                    )
                    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                    current_step.execution_time_ms = round(elapsed_ms, 2)
                    current_step.output = step_output
                    current_step.provenance = step_prov

                    if current_step.tool == "local_cache":
                        self._metrics.cache_hits += 1

                except Exception as ex:
                    step_error = str(ex)
                    current_step.error = step_error
                    self._metrics.tool_failures += 1
                    logger.error(f"Execution error on step {current_step.id}: {ex}")

                # PHASE 5: CHECK - Safety Gate & Provenance validation
                await self._publish_state(LoopPhase.CHECK)
                if not step_error:
                    safety_result = safety_gate.evaluate(current_step.provenance, current_step.description)
                    if not safety_result.is_safe and safety_result.requires_human_approval:
                        logger.warning(f"Safety Gate halted step {current_step.id}: {safety_result.reason}")
                        
                        # Enter Human Handoff mode
                        mission.status = MissionStatus.WAITING_HUMAN
                        Repository.update_mission_status(mission.id, MissionStatus.WAITING_HUMAN)
                        
                        self._pending_human_request = {
                            "mission_id": mission.id,
                            "step_id": current_step.id,
                            "reason": safety_result.reason,
                            "action_needed": "Data staleness or low trust detected. Approve or override.",
                        }
                        await self._publish_state(LoopPhase.CHECK)
                        await broadcaster.broadcast_event("safety_alert", self._pending_human_request)

                        # Wait for human response
                        self._human_response_event.clear()
                        await self._human_response_event.wait()

                        # Process human response
                        hr = self._human_response_data or {}
                        if hr.get("action") == "abort":
                            mission.status = MissionStatus.FAILED
                            Repository.update_mission_status(mission.id, MissionStatus.FAILED)
                            break
                        elif hr.get("action") == "override":
                            current_step.output = hr.get("override_data", current_step.output)
                        
                        self._pending_human_request = None
                        mission.status = MissionStatus.RUNNING
                        Repository.update_mission_status(mission.id, MissionStatus.RUNNING)

                    # Mark step completed
                    current_step.status = StepStatus.COMPLETED
                    Repository.save_step_post_execution(current_step)
                    self._metrics.steps_executed += 1
                    await self._publish_state(LoopPhase.CHECK)
                    continue

                # Tool failed: initiate PHASE 6 (RECOVER) & PHASE 7 (REPLAN)
                await self._publish_state(LoopPhase.RECOVER)
                current_step.status = StepStatus.FAILED
                Repository.save_step_post_execution(current_step)

                # Update probed capabilities so Gemma knows the tool degraded
                capabilities = await capability_engine.probe_all()

                strategy, revised_steps, handoff_data = await recovery_engine.handle_failure(
                    mission=mission,
                    failed_step=current_step,
                    error_message=step_error,
                    remaining_steps=remaining_steps,
                    capabilities=capabilities
                )

                if strategy == "retry":
                    current_step.status = StepStatus.PENDING
                    Repository.save_step_pre_execution(mission.id, current_step)
                    await asyncio.sleep(1.0)
                    continue

                elif strategy == "human_handoff":
                    mission.status = MissionStatus.WAITING_HUMAN
                    Repository.update_mission_status(mission.id, MissionStatus.WAITING_HUMAN)
                    self._pending_human_request = handoff_data
                    await self._publish_state(LoopPhase.RECOVER)
                    await broadcaster.broadcast_event("human_handoff_request", handoff_data or {})
                    
                    self._human_response_event.clear()
                    await self._human_response_event.wait()
                    
                    hr = self._human_response_data or {}
                    if hr.get("action") == "abort":
                        mission.status = MissionStatus.FAILED
                        Repository.update_mission_status(mission.id, MissionStatus.FAILED)
                        break

                    self._pending_human_request = None
                    mission.status = MissionStatus.RUNNING
                    Repository.update_mission_status(mission.id, MissionStatus.RUNNING)
                    continue

                # REPLAN succeeded with revised steps
                await self._publish_state(LoopPhase.REPLAN)
                self._metrics.replans_count += 1
                
                # Update current plan state to reflect plan mutation
                completed_so_far = [s for s in self._current_plan if s.status in [StepStatus.COMPLETED, StepStatus.FAILED]]
                self._current_plan = completed_so_far + revised_steps
                await self._publish_state(LoopPhase.REPLAN)

        except asyncio.CancelledError:
            logger.info("Agent execution loop cancelled.")
        except Exception as e:
            logger.error(f"Fatal error in agent execution loop: {e}", exc_info=True)
            if self._current_mission:
                self._current_mission.status = MissionStatus.FAILED
                Repository.update_mission_status(self._current_mission.id, MissionStatus.FAILED)
        finally:
            self._is_running = False
            await self._publish_state()

    def handle_human_input(self, req: HumanResponseRequest) -> bool:
        """Processes human operator approval, override, or mission abort."""
        if not self._pending_human_request:
            return False
        self._human_response_data = {
            "action": req.action,
            "override_data": req.override_data,
        }
        self._human_response_event.set()
        return True

    async def resume_interrupted_missions(self) -> None:
        """
        Crash-Recovery Checkpoint: Scans SQLite WAL database on startup for missions
        interrupted by unexpected process termination (SIGKILL) and seamlessly resumes.
        """
        active_mission = Repository.get_latest_active_mission()
        if not active_mission:
            logger.info("Crash Recovery: No interrupted missions detected in database.")
            return

        logger.info(f"Crash Recovery: Found interrupted mission [{active_mission.id}]. Resuming from last checkpoint...")
        steps = Repository.get_mission_steps(active_mission.id)
        
        # If a step was left in 'running', reset it to 'pending' to retry
        for s in steps:
            if s.status == StepStatus.RUNNING:
                s.status = StepStatus.PENDING
                Repository.save_step_pre_execution(active_mission.id, s)

        self._current_mission = active_mission
        self._current_plan = steps
        self._metrics = Metrics(steps_executed=sum(1 for s in steps if s.status == StepStatus.COMPLETED))

        Repository.log_audit(
            active_mission.id,
            "RECOVER",
            "sigkill_recovery",
            "Mission resumed from persistent SQLite WAL checkpoint following process restart."
        )

        self._execution_task = asyncio.create_task(self._run_mission_loop())

agent_loop = AgentLoop()
