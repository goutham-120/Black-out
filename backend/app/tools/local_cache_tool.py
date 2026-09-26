"""
Local Cache Tool for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Serves as the primary Tier-3 Strategy Ladder fallback
when cloud services drop. Interacts with SQLite WAL cache with precise staleness tracking.
"""

import time
import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

from app.tools.base import BaseTool
from app.database.repository import Repository
from app.models.capability import ToolHealth, CapabilityState
from app.models.provenance import ProvenanceMetadata

class LocalCacheTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="local_cache",
            description="High-speed SQLite-backed offline cache with integrity checksums and age tracking."
        )
        self._seed_default_cache()

    def _seed_default_cache(self) -> None:
        """Seeds standard fallback datasets so offline missions never hit an empty void."""
        try:
            Repository.set_cache_entry(
                cache_key="weather_latest",
                payload={"temperature": 18.5, "condition": "Overcast", "barometer_hpa": 1012, "source": "station_sensor_alpha"},
                source="local_micro_sensor",
                trust_score=0.92,
                checksum=hashlib.sha256(b"weather_latest_seed").hexdigest()
            )
            Repository.set_cache_entry(
                cache_key="weather_api_fallback",
                payload={"temperature": 18.5, "condition": "Overcast (Cached Baseline)", "barometer_hpa": 1012},
                source="cached_meteorological_mirror",
                trust_score=0.88,
                checksum=hashlib.sha256(b"weather_api_fallback_seed").hexdigest()
            )
            Repository.set_cache_entry(
                cache_key="internet_fallback",
                payload={"dns_status": "offline_resolver_active", "local_peers": ["192.168.1.10", "192.168.1.20"]},
                source="mesh_network_cache",
                trust_score=0.85
            )
        except Exception:
            pass

    async def _execute_internal(self, params: Dict[str, Any]) -> Tuple[Dict[str, Any], ProvenanceMetadata]:
        operation = params.get("operation", "read")
        cache_key = params.get("cache_key", "weather_latest")

        if operation == "write":
            payload = params.get("data", {})
            source = params.get("source", "agent_synthesis")
            trust = float(params.get("trust_score", 0.90))
            chk = hashlib.sha256(json.dumps(payload).encode()).hexdigest()
            Repository.set_cache_entry(cache_key=cache_key, payload=payload, source=source, trust_score=trust, checksum=chk)
            prov = ProvenanceMetadata(
                source="local_cache_write",
                timestamp=datetime.now(timezone.utc),
                age_seconds=0.0,
                trust_score=trust,
                is_synthetic=False,
                checksum=chk
            )
            return {"status": "stored", "cache_key": cache_key}, prov

        # Default: read operation
        entry = Repository.get_cache_entry(cache_key)
        if not entry:
            # Return synthetic baseline if not yet written
            prov = ProvenanceMetadata(
                source="local_cache_miss_synthetic",
                timestamp=datetime.now(timezone.utc),
                age_seconds=9999.0,
                trust_score=0.40,
                is_synthetic=True
            )
            return {"warning": f"Cache miss for '{cache_key}', using emergency baseline", "data": {}}, prov

        # Calculate age
        try:
            entry_time = datetime.fromisoformat(entry["timestamp"])
            age = (datetime.now(timezone.utc) - entry_time).total_seconds()
        except Exception:
            age = 0.0

        prov = ProvenanceMetadata(
            source=f"local_cache:{entry['source']}",
            timestamp=datetime.now(timezone.utc),
            age_seconds=max(0.0, round(age, 2)),
            trust_score=entry["trust_score"],
            is_synthetic=False,
            checksum=entry.get("checksum")
        )
        return {"cache_key": cache_key, "payload": entry["payload"]}, prov

    async def probe_health(self) -> ToolHealth:
        start = time.perf_counter()
        try:
            entry = Repository.get_cache_entry("weather_latest")
            latency = (time.perf_counter() - start) * 1000.0
            return ToolHealth(
                tool_name=self.name,
                state=CapabilityState.AVAILABLE,
                latency_ms=round(latency, 2),
                last_check=datetime.now(timezone.utc),
                details={"status": "operational", "sample_entry_found": entry is not None}
            )
        except Exception as e:
            latency = (time.perf_counter() - start) * 1000.0
            return ToolHealth(
                tool_name=self.name,
                state=CapabilityState.UNAVAILABLE,
                latency_ms=round(latency, 2),
                last_check=datetime.now(timezone.utc),
                error_message=str(e),
                details={"status": "db_error"}
            )
