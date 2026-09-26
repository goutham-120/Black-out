"""
Database module for BLACKOUT backend.
Provides crash-resilient SQLite WAL connectivity and state repositories.
"""

from app.database.connection import get_db_connection, init_database
from app.database.repository import Repository

__all__ = ["get_db_connection", "init_database", "Repository"]
