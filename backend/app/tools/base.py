"""
Base Tool Interface for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Wraps every tool execution with deterministic Chaos Switchboard
interception and automatically stamps outputs with Provenance and Trust metadata during the ACT phase.
"""

import time
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
from datetime import datetime, timezone

from app.models.capability import ToolHealth, CapabilityState
from app.models.provenance import ProvenanceMetadata

class BaseTool(ABC):
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    @abstractmethod
    async def _execute_internal(self, params: Dict[str, Any]) -> Tuple[Dict[str, Any], ProvenanceMetadata]:
        """Core execution logic implemented by individual tools."""
        pass

    @abstractmethod
    async def probe_health(self) -> ToolHealth:
        """Lightweight health probe invoked during the SENSE phase."""
        pass

    async def execute(self, params: Dict[str, Any], chaos_switchboard: Any = None) -> Tuple[Dict[str, Any], ProvenanceMetadata]:
        """
        Executes the tool with chaos interception and runtime performance timing.
        Raises RuntimeError if deterministic chaos dictates failure or interruption.
        """
        start_time = time.perf_counter()

        # Intercept with Chaos Switchboard if present
        if chaos_switchboard:
            await chaos_switchboard.intercept(self.name)

        output, provenance = await self._execute_internal(params)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        output["_execution_ms"] = round(elapsed_ms, 2)
        return output, provenance
