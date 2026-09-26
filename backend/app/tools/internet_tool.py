"""
Internet Tool for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Handles external HTTP communication. Probed during SENSE;
acts as the primary external gateway susceptible to network dropouts and blackout events.
"""

import time
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

from app.tools.base import BaseTool
from app.models.capability import ToolHealth, CapabilityState
from app.models.provenance import ProvenanceMetadata

class InternetTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="internet",
            description="Performs live external HTTP network requests and web data acquisition."
        )

    async def _execute_internal(self, params: Dict[str, Any]) -> Tuple[Dict[str, Any], ProvenanceMetadata]:
        url = params.get("url", "https://dns.google/resolve?name=example.com")
        method = params.get("method", "GET").upper()

        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.request(method, url)
            content = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text[:1000]

        prov = ProvenanceMetadata(
            source="internet_live",
            timestamp=datetime.now(timezone.utc),
            age_seconds=0.0,
            trust_score=1.0,
            is_synthetic=False,
        )
        return {"status_code": resp.status_code, "data": content}, prov

    async def probe_health(self) -> ToolHealth:
        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get("https://1.1.1.1", follow_redirects=False)
                latency = (time.perf_counter() - start) * 1000.0
                return ToolHealth(
                    tool_name=self.name,
                    state=CapabilityState.AVAILABLE if resp.status_code < 500 else CapabilityState.DEGRADED,
                    latency_ms=round(latency, 2),
                    last_check=datetime.now(timezone.utc),
                    details={"status": "online", "code": resp.status_code}
                )
        except Exception as e:
            latency = (time.perf_counter() - start) * 1000.0
            return ToolHealth(
                tool_name=self.name,
                state=CapabilityState.UNAVAILABLE,
                latency_ms=round(latency, 2),
                last_check=datetime.now(timezone.utc),
                error_message=f"Network unreachable: {str(e)}",
                details={"status": "disconnected"}
            )
