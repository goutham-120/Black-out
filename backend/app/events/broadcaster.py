"""
Server-Sent Events (SSE) Broadcaster for BLACKOUT.
Role in SENSE-REPLAN-ACT loop: Streams real-time state mutations, capability drops,
and dynamic replan decisions to the React frontend UI with zero polling latency.
"""

import asyncio
import json
import logging
from typing import AsyncGenerator, Set, Optional
from app.models.agent import AgentState

logger = logging.getLogger("blackout.events")

class EventBroadcaster:
    def __init__(self) -> None:
        self._subscribers: Set[asyncio.Queue] = set()
        self._lock = asyncio.Lock()
        self._latest_state: Optional[AgentState] = None

    async def subscribe(self) -> asyncio.Queue:
        """Registers a new SSE listener queue."""
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        async with self._lock:
            self._subscribers.add(queue)
            logger.info(f"New SSE client connected. Active subscribers: {len(self._subscribers)}")
        return queue

    async def unsubscribe(self, queue: asyncio.Queue) -> None:
        """Removes an active SSE listener."""
        async with self._lock:
            self._subscribers.discard(queue)
            logger.info(f"SSE client disconnected. Active subscribers: {len(self._subscribers)}")

    async def broadcast_state(self, state: AgentState) -> None:
        """Broadcasts full updated AgentState conforming to API contract."""
        self._latest_state = state
        payload = state.model_dump(mode="json")
        await self._broadcast_raw(event_type="agent_state", data=payload)

    async def broadcast_event(self, event_type: str, data: dict) -> None:
        """Broadcasts an operational event (e.g. chaos_alert, human_request, replan_notice)."""
        await self._broadcast_raw(event_type=event_type, data=data)

    async def _broadcast_raw(self, event_type: str, data: dict) -> None:
        async with self._lock:
            dead_queues = []
            for queue in self._subscribers:
                try:
                    queue.put_nowait({"event": event_type, "data": json.dumps(data)})
                except asyncio.QueueFull:
                    dead_queues.append(queue)
            for dq in dead_queues:
                self._subscribers.discard(dq)

    def get_latest_state(self) -> Optional[AgentState]:
        return self._latest_state

broadcaster = EventBroadcaster()
