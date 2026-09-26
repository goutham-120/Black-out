"""
Events module for BLACKOUT backend.
Provides SSE streaming broadcast capabilities.
"""

from app.events.broadcaster import broadcaster

__all__ = ["broadcaster"]
