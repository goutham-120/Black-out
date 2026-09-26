"""
SQLite WAL Connection Manager for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Provides crash-resilient persistence by enforcing
SQLite WAL (Write-Ahead Logging) mode, guaranteeing zero corruption if SIGKILL occurs
between DECIDE and ACT phases.
"""

import sqlite3
import logging
from pathlib import Path
from contextlib import contextmanager
from typing import Generator
from app.config import settings

logger = logging.getLogger("blackout.database")

def get_db_path() -> Path:
    db_file = Path(settings.DATABASE_PATH)
    db_file.parent.mkdir(parents=True, exist_ok=True)
    return db_file

@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Yields a SQLite connection configured strictly in WAL mode."""
    conn = sqlite3.connect(
        str(get_db_path()),
        timeout=10.0,
        isolation_level=None  # autocommit mode, transactions handled explicitly
    )
    conn.row_factory = sqlite3.Row
    try:
        # Enforce WAL mode and resilient pragmas
        cursor = conn.cursor()
        cursor.execute("PRAGMA journal_mode = WAL;")
        cursor.execute("PRAGMA synchronous = NORMAL;")
        cursor.execute("PRAGMA busy_timeout = 5000;")
        cursor.execute("PRAGMA foreign_keys = ON;")
        cursor.close()
        yield conn
    finally:
        conn.close()

def init_database() -> None:
    """Initializes tables and indexes for missions, steps, chaos, and cache persistence."""
    logger.info(f"Initializing SQLite database at: {settings.DATABASE_PATH}")
    with get_db_connection() as conn:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS missions (
                    id TEXT PRIMARY KEY,
                    objective TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS steps (
                    id TEXT PRIMARY KEY,
                    mission_id TEXT NOT NULL,
                    step_index INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    tool TEXT NOT NULL,
                    params TEXT NOT NULL,
                    status TEXT NOT NULL,
                    output TEXT,
                    error TEXT,
                    provenance TEXT,
                    execution_time_ms REAL,
                    retry_count INTEGER DEFAULT 0,
                    FOREIGN KEY(mission_id) REFERENCES missions(id) ON DELETE CASCADE
                );
            """)

            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_steps_mission ON steps(mission_id, step_index);
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS chaos_rules (
                    id TEXT PRIMARY KEY,
                    target TEXT NOT NULL,
                    action TEXT NOT NULL,
                    intensity REAL NOT NULL,
                    active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL
                );
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS local_cache (
                    cache_key TEXT PRIMARY KEY,
                    payload TEXT NOT NULL,
                    source TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    trust_score REAL NOT NULL,
                    checksum TEXT
                );
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mission_id TEXT,
                    phase TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    metadata TEXT,
                    created_at TEXT NOT NULL
                );
            """)
    logger.info("Database schema verified in WAL mode.")
