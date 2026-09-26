/**
 * @file api.ts
 * @description REST API and Server-Sent Events (SSE) streaming service for BLACKOUT.
 * Facilitates bidirectional control between the Mission Control UI and the FastAPI backend,
 * enabling triggers for mission execution, chaos injection, handoff resolution, and real-time state telemetry.
 */

import { FullAgentState } from '../types/agent';

const API_BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || '';

/**
 * Initiates a new autonomous mission with a specified natural language objective.
 */
export async function startMission(objective: string): Promise<void> {
  const response = await fetch(`${API_BASE}/agent/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ objective }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to start mission (${response.status}): ${errText}`);
  }
}

/**
 * Injects deterministic failure or degraded conditions into a target capability.
 */
export async function triggerChaos(target: string, action: string): Promise<void> {
  const response = await fetch(`${API_BASE}/agent/chaos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ target, action }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to trigger chaos on ${target} (${response.status}): ${errText}`);
  }
}

/**
 * Simulates a process crash/restart to test state resumption from SQLite WAL.
 */
export async function restartAgent(): Promise<void> {
  const response = await fetch(`${API_BASE}/agent/restart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to restart agent (${response.status}): ${errText}`);
  }
}

/**
 * Restores all mock environment capabilities to operational AVAILABLE status.
 */
export async function restoreEnvironment(): Promise<void> {
  const response = await fetch(`${API_BASE}/agent/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to restore environment (${response.status}): ${errText}`);
  }
}

/**
 * Resolves a blocked mission in HUMAN_HANDOFF_REQUIRED status with operator verdict.
 */
export async function resolveHandoff(handoff_id: string, decision: string): Promise<void> {
  const response = await fetch(`${API_BASE}/agent/handoff/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ handoff_id, decision }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to resolve handoff ${handoff_id} (${response.status}): ${errText}`);
  }
}

/**
 * Subscribes to the live Agent state SSE stream.
 * Automatically parses incoming state envelopes and provides a teardown unsubscribe handler.
 */
export function subscribeToAgentStream(
  onUpdate: (state: FullAgentState) => void,
  onError?: (err?: Event) => void
): () => void {
  const streamUrl = `${API_BASE}/agent/stream`;
  const eventSource = new EventSource(streamUrl);

  eventSource.onmessage = (event: MessageEvent) => {
    try {
      if (!event.data) return;
      const parsed: FullAgentState = JSON.parse(event.data);
      onUpdate(parsed);
    } catch (err) {
      console.error('[BLACKOUT SSE] Failed to parse agent state stream payload:', err, event.data);
    }
  };

  eventSource.onerror = (event: Event) => {
    if (onError) {
      onError(event);
    }
  };

  return () => {
    eventSource.close();
  };
}
