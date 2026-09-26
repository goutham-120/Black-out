"""
Repository for Persistent State Management in BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Commits all decisions, state transitions, and step checkpoints
to WAL-mode SQLite prior to execution to enable seamless SIGKILL crash-recovery.
"""

import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.database.connection import get_db_connection
from app.models.agent import Mission, Step, MissionStatus, StepStatus
from app.models.provenance import ProvenanceMetadata
from app.models.chaos import ChaosRule

class Repository:
    @staticmethod
    def save_mission(mission: Mission) -> None:
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO missions (id, objective, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    status=excluded.status,
                    updated_at=excluded.updated_at;
                """,
                (
                    mission.id,
                    mission.objective,
                    mission.status.value if isinstance(mission.status, MissionStatus) else mission.status,
                    mission.created_at.isoformat(),
                    mission.updated_at.isoformat(),
                )
            )

    @staticmethod
    def update_mission_status(mission_id: str, status: MissionStatus) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with get_db_connection() as conn:
            conn.execute(
                "UPDATE missions SET status = ?, updated_at = ? WHERE id = ?;",
                (status.value if isinstance(status, MissionStatus) else status, now, mission_id)
            )

    @staticmethod
    def get_mission(mission_id: str) -> Optional[Mission]:
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, objective, status, created_at, updated_at FROM missions WHERE id = ?;", (mission_id,))
            row = cur.fetchone()
            if not row:
                return None
            return Mission(
                id=row["id"],
                objective=row["objective"],
                status=MissionStatus(row["status"]),
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"]),
            )

    @staticmethod
    def get_latest_active_mission() -> Optional[Mission]:
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id, objective, status, created_at, updated_at FROM missions
                WHERE status IN ('running', 'paused', 'waiting_human')
                ORDER BY updated_at DESC LIMIT 1;
                """
            )
            row = cur.fetchone()
            if not row:
                return None
            return Mission(
                id=row["id"],
                objective=row["objective"],
                status=MissionStatus(row["status"]),
                created_at=datetime.fromisoformat(row["created_at"]),
                updated_at=datetime.fromisoformat(row["updated_at"]),
            )

    @staticmethod
    def save_initial_plan(mission_id: str, steps: List[Step]) -> None:
        with get_db_connection() as conn:
            with conn:
                conn.execute("DELETE FROM steps WHERE mission_id = ?;", (mission_id,))
                for s in steps:
                    conn.execute(
                        """
                        INSERT INTO steps (id, mission_id, step_index, description, tool, params, status, output, error, provenance, execution_time_ms, retry_count)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                        """,
                        (
                            s.id,
                            mission_id,
                            s.index,
                            s.description,
                            s.tool,
                            json.dumps(s.params),
                            s.status.value if isinstance(s.status, StepStatus) else s.status,
                            json.dumps(s.output) if s.output is not None else None,
                            s.error,
                            s.provenance.model_dump_json() if s.provenance else None,
                            s.execution_time_ms,
                            s.retry_count,
                        )
                    )

    @staticmethod
    def save_step_pre_execution(mission_id: str, step: Step) -> None:
        """Pre-execution write: logs step state BEFORE executing the tool."""
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO steps (id, mission_id, step_index, description, tool, params, status, retry_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    status=excluded.status,
                    retry_count=excluded.retry_count,
                    params=excluded.params;
                """,
                (
                    step.id,
                    mission_id,
                    step.index,
                    step.description,
                    step.tool,
                    json.dumps(step.params),
                    step.status.value if isinstance(step.status, StepStatus) else step.status,
                    step.retry_count,
                )
            )

    @staticmethod
    def save_step_post_execution(step: Step) -> None:
        """Post-execution write: persists output, error, provenance, and final status."""
        with get_db_connection() as conn:
            conn.execute(
                """
                UPDATE steps SET
                    status = ?,
                    output = ?,
                    error = ?,
                    provenance = ?,
                    execution_time_ms = ?,
                    retry_count = ?
                WHERE id = ?;
                """,
                (
                    step.status.value if isinstance(step.status, StepStatus) else step.status,
                    json.dumps(step.output) if step.output is not None else None,
                    step.error,
                    step.provenance.model_dump_json() if step.provenance else None,
                    step.execution_time_ms,
                    step.retry_count,
                    step.id,
                )
            )

    @staticmethod
    def save_plan_mutation(mission_id: str, completed_step_id: str, new_steps: List[Step]) -> None:
        """
        Mutates the remaining plan atomically inside a transaction.
        Preserves all completed steps, drops or replaces remaining pending steps with revised sequence.
        """
        with get_db_connection() as conn:
            with conn:
                # Find current step's index
                cur = conn.cursor()
                cur.execute("SELECT step_index FROM steps WHERE id = ?;", (completed_step_id,))
                current_row = cur.fetchone()
                current_index = current_row["step_index"] if current_row else -1

                # Delete all pending steps following current_index
                conn.execute(
                    "DELETE FROM steps WHERE mission_id = ? AND step_index > ? AND status = 'pending';",
                    (mission_id, current_index)
                )

                # Insert the revised steps
                for s in new_steps:
                    conn.execute(
                        """
                        INSERT INTO steps (id, mission_id, step_index, description, tool, params, status, retry_count)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(id) DO UPDATE SET
                            description=excluded.description,
                            tool=excluded.tool,
                            params=excluded.params,
                            status=excluded.status;
                        """,
                        (
                            s.id,
                            mission_id,
                            s.index,
                            s.description,
                            s.tool,
                            json.dumps(s.params),
                            s.status.value if isinstance(s.status, StepStatus) else s.status,
                            s.retry_count,
                        )
                    )

    @staticmethod
    def get_mission_steps(mission_id: str) -> List[Step]:
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id, step_index, description, tool, params, status, output, error, provenance, execution_time_ms, retry_count
                FROM steps WHERE mission_id = ?
                ORDER BY step_index ASC;
                """,
                (mission_id,)
            )
            rows = cur.fetchall()
            steps = []
            for r in rows:
                prov = None
                if r["provenance"]:
                    try:
                        prov = ProvenanceMetadata.model_validate_json(r["provenance"])
                    except Exception:
                        prov = None
                steps.append(
                    Step(
                        id=r["id"],
                        index=r["step_index"],
                        description=r["description"],
                        tool=r["tool"],
                        params=json.loads(r["params"]) if r["params"] else {},
                        status=StepStatus(r["status"]),
                        output=json.loads(r["output"]) if r["output"] else None,
                        error=r["error"],
                        provenance=prov,
                        execution_time_ms=r["execution_time_ms"],
                        retry_count=r["retry_count"],
                    )
                )
            return steps

    @staticmethod
    def log_audit(mission_id: Optional[str], phase: str, event_type: str, message: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO audit_logs (mission_id, phase, event_type, message, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?);
                """,
                (mission_id, phase, event_type, message, json.dumps(metadata) if metadata else None, now)
            )

    @staticmethod
    def upsert_chaos_rule(rule: ChaosRule) -> None:
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO chaos_rules (id, target, action, intensity, active, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    action=excluded.action,
                    intensity=excluded.intensity,
                    active=excluded.active;
                """,
                (rule.id, rule.target, rule.action, rule.intensity, 1 if rule.active else 0, rule.created_at)
            )

    @staticmethod
    def get_active_chaos_rules() -> List[ChaosRule]:
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, target, action, intensity, active, created_at FROM chaos_rules WHERE active = 1;")
            rows = cur.fetchall()
            return [
                ChaosRule(
                    id=r["id"],
                    target=r["target"],
                    action=r["action"],
                    intensity=r["intensity"],
                    active=bool(r["active"]),
                    created_at=r["created_at"],
                )
                for r in rows
            ]

    @staticmethod
    def remove_chaos_rule(target: str) -> None:
        with get_db_connection() as conn:
            conn.execute("UPDATE chaos_rules SET active = 0 WHERE target = ?;", (target,))

    @staticmethod
    def clear_all_chaos() -> None:
        with get_db_connection() as conn:
            conn.execute("UPDATE chaos_rules SET active = 0;")

    @staticmethod
    def set_cache_entry(cache_key: Optional[str] = None, payload: Dict[str, Any] = None, source: str = "", trust_score: float = 1.0, checksum: Optional[str] = None, key: Optional[str] = None) -> None:
        target_key = key or cache_key or "default"
        payload_data = payload if payload is not None else {}
        now = datetime.now(timezone.utc).isoformat()
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO local_cache (cache_key, payload, source, timestamp, trust_score, checksum)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(cache_key) DO UPDATE SET
                    payload=excluded.payload,
                    source=excluded.source,
                    timestamp=excluded.timestamp,
                    trust_score=excluded.trust_score,
                    checksum=excluded.checksum;
                """,
                (target_key, json.dumps(payload_data), source, now, trust_score, checksum)
            )

    @staticmethod
    def get_cache_entry(cache_key: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT cache_key, payload, source, timestamp, trust_score, checksum FROM local_cache WHERE cache_key = ?;", (cache_key,))
            row = cur.fetchone()
            if not row:
                return None
            return {
                "cache_key": row["cache_key"],
                "payload": json.loads(row["payload"]),
                "source": row["source"],
                "timestamp": row["timestamp"],
                "trust_score": row["trust_score"],
                "checksum": row["checksum"],
            }
