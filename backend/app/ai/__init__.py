"""
AI Engine module for BLACKOUT backend.
Provides local Gemma 4 client integration, schema validation, and prompts.
"""

from app.ai.gemma_client import GemmaClient, gemma_client
from app.ai.prompts import PLANNING_SYSTEM_PROMPT, REPLANNING_SYSTEM_PROMPT

__all__ = ["GemmaClient", "gemma_client", "PLANNING_SYSTEM_PROMPT", "REPLANNING_SYSTEM_PROMPT"]
