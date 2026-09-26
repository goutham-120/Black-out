"""
Capability Engine for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Continuously probes internal tools and external interfaces
during the SENSE phase, calculating health, latency, and operational states for the DECIDE and REPLAN phases.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Optional

from app.config import settings
from app.models.capability import ToolHealth, CapabilityState
from app.tools.registry import tool_registry
from app.engines.chaos_switchboard import chaos_switchboard

logger = logging.getLogger("blackout.engines.capability")

class CapabilityEngine:
    def __init__(self):
        self._capabilities: Dict[str, ToolHealth] = {}
        self._probe_task: Optional[asyncio.Task] = None
        self._running: bool = False

    async def probe_all(self) -> Dict[str, ToolHealth]:
        """Probes all tools and reconciles with active chaos switchboard rules."""
        raw_health = await tool_registry.probe_all()

        for name, health in raw_health.items():
            # Check if chaos switchboard has an active rule overriding this capability
            rule = chaos_switchboard.get_rule_for_target(name)
            if not rule and name == "weather_api":
                # If internet is killed, weather_api is also degraded/unavailable
                rule = chaos_switchboard.get_rule_for_target("internet")

            if rule and rule.active:
                if rule.action == "kill":
                    health.state = CapabilityState.UNAVAILABLE
                    health.error_message = f"Chaos Switchboard fault injected: {rule.action.upper()}"
                elif rule.action in ["latency", "stale"]:
                    health.state = CapabilityState.DEGRADED
                    health.error_message = f"Chaos Switchboard latency injected ({rule.intensity * 2:.1f}s)"
                elif rule.action == "corrupt":
                    health.state = CapabilityState.DEGRADED
                    health.error_message = "Checksum validation failures reported"

            self._capabilities[name] = health

        return self._capabilities

    def get_current_capabilities(self) -> Dict[str, ToolHealth]:
        """Returns the most recent probed capabilities snapshot."""
        return self._capabilities

    async def start_background_probing(self) -> None:
        """Starts asynchronous polling loop to maintain fresh capability health metrics."""
        if self._running:
            return
        self._running = True
        self._probe_task = asyncio.create_task(self._probe_loop())
        logger.info("Capability Engine background monitor started.")

    async def stop_background_probing(self) -> None:
        self._running = False
        if self._probe_task:
            self._probe_task.cancel()
            try:
                await self._probe_task
            except asyncio.CancelledError:
                pass
        logger.info("Capability Engine background monitor stopped.")

    async def _probe_loop(self) -> None:
        while self._running:
            try:
                await self.probe_all()
            except Exception as e:
                logger.error(f"Error during capability probe cycle: {e}")
            await asyncio.sleep(settings.PROBE_INTERVAL_SECONDS)

capability_engine = CapabilityEngine()
