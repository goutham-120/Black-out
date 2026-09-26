"""
Local Gemma 4 AI Engine Client for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Interfaces with locally hosted quantized Gemma 4 (via Ollama or llama.cpp),
enforcing strict JSON schema validation for plan creation (DECIDE) and plan reconstruction (REPLAN).
"""

import json
import re
import logging
from typing import Dict, Any, List, Optional
import httpx

from app.config import settings
from app.models.capability import ToolHealth, CapabilityState
from app.models.agent import Step
from app.models.gemma_schemas import (
    GemmaPlanResponse,
    GemmaReplanResponse,
    GemmaStepOutput,
)
from app.ai.prompts import PLANNING_SYSTEM_PROMPT, REPLANNING_SYSTEM_PROMPT

logger = logging.getLogger("blackout.ai.gemma")

class GemmaClient:
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.GEMMA_MODEL_NAME
        self.timeout = settings.AI_TIMEOUT_SECONDS

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extracts and parses JSON from raw LLM output, stripping markdown code blocks if present."""
        clean_text = text.strip()
        # Remove markdown code blocks if wrapped
        if "```" in clean_text:
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", clean_text, re.DOTALL)
            if match:
                clean_text = match.group(1)
            else:
                # Find first { and last }
                start = clean_text.find("{")
                end = clean_text.rfind("}")
                if start != -1 and end != -1:
                    clean_text = clean_text[start : end + 1]

        return json.loads(clean_text)

    async def _call_ollama(self, prompt: str, system: str) -> Optional[Dict[str, Any]]:
        """Makes an asynchronous HTTP request to the local Ollama /api/generate endpoint."""
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,  # Low temperature for deterministic planning
                "top_p": 0.9,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    response_text = data.get("response", "")
                    return self._extract_json(response_text)
                else:
                    logger.warning(f"Ollama returned HTTP {resp.status_code}: {resp.text}")
                    return None
        except Exception as e:
            logger.info(f"Local Ollama connection offline or unavailable ({e}). Utilizing deterministic Gemma local engine.")
            return None

    def _deterministic_local_planner(self, objective: str, capabilities: Dict[str, ToolHealth]) -> GemmaPlanResponse:
        """
        Deterministic local fallback planner for zero-downtime offline resilience
        when Ollama service is warming up, offline, or disconnected.
        """
        weather_avail = capabilities.get("weather_api", ToolHealth(tool_name="weather_api", state=CapabilityState.AVAILABLE)).state == CapabilityState.AVAILABLE
        internet_avail = capabilities.get("internet", ToolHealth(tool_name="internet", state=CapabilityState.AVAILABLE)).state == CapabilityState.AVAILABLE
        cache_avail = capabilities.get("local_cache", ToolHealth(tool_name="local_cache", state=CapabilityState.AVAILABLE)).state == CapabilityState.AVAILABLE
        fs_avail = capabilities.get("filesystem", ToolHealth(tool_name="filesystem", state=CapabilityState.AVAILABLE)).state == CapabilityState.AVAILABLE

        steps = []
        obj_lower = objective.lower()

        if "weather" in obj_lower or "forecast" in obj_lower or "storm" in obj_lower or "sensor" in obj_lower:
            if weather_avail:
                steps.append(GemmaStepOutput(
                    description="Fetch live meteorological report from external Weather API",
                    tool="weather_api",
                    params={"location": "default", "units": "metric"}
                ))
            elif cache_avail:
                steps.append(GemmaStepOutput(
                    description="Fallback: Retrieve cached weather data and local sensor telemetry",
                    tool="local_cache",
                    params={"cache_key": "weather_latest"}
                ))
            else:
                steps.append(GemmaStepOutput(
                    description="Fallback: Read local offline weather station telemetry file",
                    tool="filesystem",
                    params={"operation": "read", "path": "local_sensor_feed.json"}
                ))

        if "calendar" in obj_lower or "schedule" in obj_lower or "meeting" in obj_lower or "event" in obj_lower:
            steps.append(GemmaStepOutput(
                description="Query local offline calendar database for urgent mission events",
                tool="calendar",
                params={"query": "today"}
            ))

        if "file" in obj_lower or "backup" in obj_lower or "data" in obj_lower or "log" in obj_lower or not steps:
            steps.append(GemmaStepOutput(
                description="Inspect local filesystem for operational integrity and baseline configuration",
                tool="filesystem",
                params={"operation": "read", "path": "system_status.json"}
            ))

        # Always verify state into local cache
        steps.append(GemmaStepOutput(
            description="Persist current mission synthesis into SQLite local cache",
            tool="local_cache",
            params={"operation": "write", "cache_key": "mission_synthesis"}
        ))

        return GemmaPlanResponse(
            reasoning=f"Formulated resilient plan for '{objective}' based on probed capability states.",
            steps=steps,
            risk_assessment="low" if weather_avail and internet_avail else "medium"
        )

    def _deterministic_local_replanner(
        self,
        failed_step: Step,
        error_msg: str,
        remaining_steps: List[Step],
        capabilities: Dict[str, ToolHealth]
    ) -> GemmaReplanResponse:
        """Deterministic strategy ladder replanner when local Gemma 4 endpoint is unreachable."""
        failed_tool = failed_step.tool
        revised_steps = []
        strategy = "local_fallback"

        if failed_tool in ["weather_api", "internet"]:
            strategy = "alt_tool"
            # Swap with local cache or local filesystem sensor
            revised_steps.append(GemmaStepOutput(
                description=f"Local Resilience Fallback: Query verified offline cache for {failed_tool} replacement",
                tool="local_cache",
                params={"cache_key": f"{failed_tool}_fallback", "original_step_id": failed_step.id}
            ))
            # Also adapt remaining steps that might have depended on the failed tool
            for s in remaining_steps:
                if s.tool == failed_tool:
                    revised_steps.append(GemmaStepOutput(
                        description=f"Offline Substitute for {s.description}",
                        tool="local_cache",
                        params={"cache_key": f"{s.tool}_offline_data"}
                    ))
                else:
                    revised_steps.append(GemmaStepOutput(
                        description=s.description,
                        tool=s.tool,
                        params=s.params
                    ))
        elif failed_tool == "filesystem":
            strategy = "local_fallback"
            revised_steps.append(GemmaStepOutput(
                description="Fallback to in-memory SQLite storage due to filesystem disruption",
                tool="local_cache",
                params={"cache_key": "fs_emergency_mirror"}
            ))
        else:
            strategy = "human_handoff"
            revised_steps.append(GemmaStepOutput(
                description="Handoff to human supervisor due to unrecoverable tool fault",
                tool="calendar",
                params={"escalation": True}
            ))

        return GemmaReplanResponse(
            failure_analysis=f"Tool '{failed_tool}' failed with error: {error_msg}. Capability marked degraded.",
            strategy_chosen=strategy,
            revised_steps=revised_steps,
            discarded_tools=[failed_tool]
        )

    async def generate_plan(self, objective: str, capabilities: Dict[str, ToolHealth]) -> GemmaPlanResponse:
        """Generates an initial execution plan conditioned on active capabilities."""
        cap_summary = {k: v.state.value for k, v in capabilities.items()}
        prompt = f"""
MISSION OBJECTIVE: {objective}

CURRENT TOOL CAPABILITY HEALTH:
{json.dumps(cap_summary, indent=2)}

Formulate a concise, fault-tolerant execution plan. Choose ONLY available tools.
Output raw JSON matching the schema.
"""
        response_dict = await self._call_ollama(prompt=prompt, system=PLANNING_SYSTEM_PROMPT)
        if response_dict:
            try:
                return GemmaPlanResponse.model_validate(response_dict)
            except Exception as e:
                logger.error(f"Schema validation error on Gemma output: {e}. Falling back to deterministic planner.")

        return self._deterministic_local_planner(objective, capabilities)

    async def replan(
        self,
        failed_step: Step,
        error_msg: str,
        remaining_steps: List[Step],
        capabilities: Dict[str, ToolHealth]
    ) -> GemmaReplanResponse:
        """Replans remaining execution steps following a tool failure or capability drop."""
        cap_summary = {k: v.state.value for k, v in capabilities.items()}
        prompt = f"""
INCIDENT REPORT:
Failed Step ID: {failed_step.id}
Failed Tool: {failed_step.tool}
Failure Error: {error_msg}

CURRENT CAPABILITIES:
{json.dumps(cap_summary, indent=2)}

REMAINING PENDING STEPS:
{json.dumps([{"description": s.description, "tool": s.tool, "params": s.params} for s in remaining_steps], indent=2)}

Evaluate the Strategy Ladder (Alt-Tool, Local Fallback, Human Handoff).
Rewrite remaining steps using only operational capabilities.
Output raw JSON matching the schema.
"""
        response_dict = await self._call_ollama(prompt=prompt, system=REPLANNING_SYSTEM_PROMPT)
        if response_dict:
            try:
                return GemmaReplanResponse.model_validate(response_dict)
            except Exception as e:
                logger.error(f"Schema validation error on Gemma replan output: {e}. Falling back to deterministic replanner.")

        return self._deterministic_local_replanner(failed_step, error_msg, remaining_steps, capabilities)

gemma_client = GemmaClient()
