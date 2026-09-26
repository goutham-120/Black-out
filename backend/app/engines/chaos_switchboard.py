"""
Chaos Switchboard Engine for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Intercepts every tool invocation during the ACT phase,
deterministically injecting faults, latency, or corruption based on UI switchboard commands.
"""

import asyncio
import logging
import random
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from app.models.chaos import ChaosPayload, ChaosRule
from app.database.repository import Repository
from app.events.broadcaster import broadcaster

logger = logging.getLogger("blackout.engines.chaos")

class ChaosSwitchboard:
    def __init__(self):
        self._rules: Dict[str, ChaosRule] = {}
        self._reload_rules_from_db()

    def _reload_rules_from_db(self) -> None:
        """Loads persistent chaos rules from SQLite WAL database upon startup."""
        try:
            from app.database.connection import init_database
            init_database()
            active_rules = Repository.get_active_chaos_rules()
            for r in active_rules:
                self._rules[r.target] = r
            logger.info(f"Loaded {len(self._rules)} active chaos rules from persistent database.")
        except Exception as e:
            logger.warning(f"Could not load chaos rules on startup: {e}")

    async def inject_chaos(self, payload: ChaosPayload) -> ChaosRule:
        """Injects or clears a deterministic chaos rule."""
        target = payload.target.lower()
        action = payload.action.lower()

        if action in ["restore", "clear", "heal"]:
            if target in self._rules:
                del self._rules[target]
            Repository.remove_chaos_rule(target)
            logger.info(f"Chaos cleared on target: '{target}'")
            await broadcaster.broadcast_event(
                event_type="chaos_healed",
                data={"target": target, "action": action, "timestamp": datetime.now(timezone.utc).isoformat()}
            )
            return ChaosRule(
                id=str(uuid.uuid4()),
                target=target,
                action="restored",
                intensity=0.0,
                active=False,
                created_at=datetime.now(timezone.utc).isoformat(),
            )

        rule = ChaosRule(
            id=str(uuid.uuid4()),
            target=target,
            action=action,
            intensity=payload.intensity,
            active=True,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        self._rules[target] = rule
        Repository.upsert_chaos_rule(rule)
        logger.warning(f"Deterministic Chaos Injected -> Target: '{target}', Action: '{action}', Intensity: {payload.intensity}")

        await broadcaster.broadcast_event(
            event_type="chaos_injected",
            data={
                "id": rule.id,
                "target": rule.target,
                "action": rule.action,
                "intensity": rule.intensity,
                "timestamp": rule.created_at,
            }
        )
        return rule

    def get_active_rules(self) -> List[ChaosRule]:
        return list(self._rules.values())

    def get_rule_for_target(self, target: str) -> Optional[ChaosRule]:
        return self._rules.get(target.lower())

    async def intercept(self, tool_name: str) -> None:
        """
        Interception point called by BaseTool.execute().
        If a matching chaos rule exists, enforces the fault deterministically.
        """
        target = tool_name.lower()
        rule = self._rules.get(target)

        # Cross-subsystem rules (e.g. 'internet' also disrupts 'weather_api')
        if not rule and target == "weather_api" and "internet" in self._rules:
            rule = self._rules["internet"]

        if not rule or not rule.active:
            return

        action = rule.action.lower()
        intensity = rule.intensity

        # Probabilistic trigger based on intensity
        if random.random() > intensity:
            return

        if action == "kill":
            msg = f"Deterministic Chaos Injection: Subsystem '{target}' was terminated."
            logger.error(msg)
            raise ConnectionResetError(msg)

        elif action == "latency":
            delay = 2.0 * intensity
            logger.warning(f"Deterministic Chaos Injection: Injecting {delay:.2f}s latency into '{target}'.")
            await asyncio.sleep(delay)

        elif action == "corrupt":
            msg = f"Deterministic Chaos Injection: Data integrity fault encountered on '{target}'."
            logger.error(msg)
            raise ValueError(msg)

        elif action == "stale":
            logger.warning(f"Deterministic Chaos Injection: Degrading freshness profile of '{target}'.")

chaos_switchboard = ChaosSwitchboard()
