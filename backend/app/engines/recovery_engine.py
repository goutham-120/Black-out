"""
Recovery Engine for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Orchestrates the RECOVER and REPLAN phases when a tool fails
or data degrades. Evaluates the multi-tier Strategy Ladder (Retry -> Alt-Tool -> Local Fallback -> Human Handoff)
and prompts Gemma 4 to adapt the remaining plan.
"""

import logging
import uuid
from typing import List, Optional, Tuple

from app.models.agent import Step, StepStatus, Mission, MissionStatus
from app.models.capability import ToolHealth, CapabilityState
from app.models.gemma_schemas import GemmaReplanResponse, GemmaStepOutput
from app.database.repository import Repository
from app.ai.gemma_client import gemma_client
from app.engines.chaos_switchboard import chaos_switchboard
from app.events.broadcaster import broadcaster

logger = logging.getLogger("blackout.engines.recovery")

class RecoveryEngine:
    def __init__(self):
        pass

    async def handle_failure(
        self,
        mission: Mission,
        failed_step: Step,
        error_message: str,
        remaining_steps: List[Step],
        capabilities: dict[str, ToolHealth]
    ) -> Tuple[str, List[Step], Optional[dict]]:
        """
        Executes the Strategy Ladder:
        1. Retry (if transient and un-retried)
        2. Alt-Tool / Local Fallback via Gemma 4 replanning
        3. Human Handoff (if critical failure or zero local fallbacks)
        """
        logger.warning(
            f"Recovery Engine initiated for Step [{failed_step.id} - '{failed_step.description}'] (Tool: {failed_step.tool}). Error: {error_message}"
        )

        Repository.log_audit(
            mission_id=mission.id,
            phase="RECOVER",
            event_type="tool_failure_intercepted",
            message=f"Tool '{failed_step.tool}' failed: {error_message}",
            metadata={"step_id": failed_step.id, "retry_count": failed_step.retry_count}
        )

        # Check if tool was explicitly killed by Chaos Switchboard
        chaos_rule = chaos_switchboard.get_rule_for_target(failed_step.tool)
        is_permanently_killed = chaos_rule and chaos_rule.action == "kill" and chaos_rule.active

        # Ladder Step 1: Retry (Single attempt allowed for transient issues, disallowed if killed by chaos)
        if failed_step.retry_count < 1 and not is_permanently_killed:
            logger.info(f"Strategy Ladder Tier 1 (Retry): Attempting retry on step {failed_step.id}")
            failed_step.retry_count += 1
            return "retry", [failed_step] + remaining_steps, None

        # Ladder Step 2 & 3: Alt-Tool / Local Fallback (Prompts Gemma 4 to regenerate plan)
        logger.info(f"Strategy Ladder Tier 2/3 (Alt-Tool / Local Fallback): Querying Gemma 4 replanner...")
        replan_res: GemmaReplanResponse = await gemma_client.replan(
            failed_step=failed_step,
            error_msg=error_message,
            remaining_steps=remaining_steps,
            capabilities=capabilities
        )

        # Ladder Step 4: Human Handoff check
        if replan_res.strategy_chosen == "human_handoff":
            logger.warning("Strategy Ladder Tier 4 (Human Handoff): Gemma 4 determined human supervision is mandatory.")
            handoff_payload = {
                "mission_id": mission.id,
                "step_id": failed_step.id,
                "reason": replan_res.failure_analysis,
                "failed_tool": failed_step.tool,
                "error": error_message,
                "recommendation": "Manual input or external clearance required to proceed.",
            }
            return "human_handoff", [], handoff_payload

        # Convert Gemma's revised steps to Step models
        base_index = failed_step.index + 1
        new_steps: List[Step] = []
        for i, g_step in enumerate(replan_res.revised_steps):
            new_steps.append(
                Step(
                    id=f"step_replan_{uuid.uuid4().hex[:6]}",
                    index=base_index + i,
                    description=g_step.description,
                    tool=g_step.tool,
                    params=g_step.params,
                    status=StepStatus.PENDING,
                )
            )

        # Persist plan mutation atomically to SQLite WAL
        Repository.save_plan_mutation(
            mission_id=mission.id,
            completed_step_id=failed_step.id,
            new_steps=new_steps
        )

        Repository.log_audit(
            mission_id=mission.id,
            phase="REPLAN",
            event_type="plan_mutated",
            message=f"Plan reconstructed via {replan_res.strategy_chosen}. {len(new_steps)} new steps generated.",
            metadata={"strategy": replan_res.strategy_chosen, "dropped_tools": replan_res.discarded_tools}
        )

        await broadcaster.broadcast_event(
            event_type="replanned",
            data={
                "mission_id": mission.id,
                "failed_tool": failed_step.tool,
                "strategy": replan_res.strategy_chosen,
                "analysis": replan_res.failure_analysis,
                "new_step_count": len(new_steps),
            }
        )

        return replan_res.strategy_chosen, new_steps, None

recovery_engine = RecoveryEngine()
