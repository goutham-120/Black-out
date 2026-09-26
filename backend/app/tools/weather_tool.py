"""
Weather Tool for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Fetches meteorological and environmental conditions.
Demonstrates dynamic fallback when internet or live API drops during missions.
"""

import time
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

from app.tools.base import BaseTool
from app.models.capability import ToolHealth, CapabilityState
from app.models.provenance import ProvenanceMetadata

class WeatherTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="weather_api",
            description="Acquires live weather telemetry, barometric pressure, and storm warnings."
        )

    async def _execute_internal(self, params: Dict[str, Any]) -> Tuple[Dict[str, Any], ProvenanceMetadata]:
        latitude = params.get("latitude", 37.7749)
        longitude = params.get("longitude", -122.4194)
        
        # Real call to Open-Meteo free API
        url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current_weather=true"
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise RuntimeError(f"Weather API returned status code {resp.status_code}")
            data = resp.json()

        prov = ProvenanceMetadata(
            source="open_meteo_live",
            timestamp=datetime.now(timezone.utc),
            age_seconds=0.0,
            trust_score=0.98,
            is_synthetic=False,
        )
        return {"current_weather": data.get("current_weather", {})}, prov

    async def probe_health(self) -> ToolHealth:
        start = time.perf_counter()
        try:
            url = "https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current_weather=true"
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(url)
                latency = (time.perf_counter() - start) * 1000.0
                if resp.status_code == 200:
                    return ToolHealth(
                        tool_name=self.name,
                        state=CapabilityState.AVAILABLE,
                        latency_ms=round(latency, 2),
                        last_check=datetime.now(timezone.utc),
                        details={"endpoint": "open-meteo", "status": "nominal"}
                    )
                return ToolHealth(
                    tool_name=self.name,
                    state=CapabilityState.DEGRADED,
                    latency_ms=round(latency, 2),
                    last_check=datetime.now(timezone.utc),
                    error_message=f"HTTP {resp.status_code}",
                    details={"status": "degraded"}
                )
        except Exception as e:
            latency = (time.perf_counter() - start) * 1000.0
            return ToolHealth(
                tool_name=self.name,
                state=CapabilityState.UNAVAILABLE,
                latency_ms=round(latency, 2),
                last_check=datetime.now(timezone.utc),
                error_message=str(e),
                details={"status": "offline"}
            )
