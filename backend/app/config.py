"""
Configuration settings for BLACKOUT backend engine.
Role in SENSE-REPLAN-ACT loop: Provides centralized environment parameters,
database configuration, and local Gemma 4 runtime connection parameters.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    APP_NAME: str = "BLACKOUT Engine"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # SQLite WAL Database configuration for crash-resilience
    DATABASE_PATH: str = str(BASE_DIR / "blackout.db")
    
    # Local Gemma 4 Model Configuration (Ollama / llama.cpp)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    GEMMA_MODEL_NAME: str = os.getenv("GEMMA_MODEL_NAME", "gemma:latest")
    AI_TIMEOUT_SECONDS: float = 30.0
    
    # Safety Gate & Provenance Thresholds
    STALE_DATA_THRESHOLD_SECONDS: float = 3600.0  # 1 hour
    CRITICAL_TRUST_THRESHOLD: float = 0.50        # Below this requires Human Handoff
    
    # Capability Engine Probing
    PROBE_INTERVAL_SECONDS: float = 5.0

settings = Settings()
