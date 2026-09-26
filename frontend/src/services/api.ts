/**
 * @file api.ts
 * @description REST API and Server-Sent Events (SSE) streaming service for BLACKOUT.
 * Facilitates bidirectional control between the Mission Control UI and the FastAPI backend,
 * enabling triggers for mission execution, chaos injection, handoff resolution, and real-time state telemetry.
 */

import { FullAgentState, CapabilityStatus, Step, Capability, Metrics } from '../types/agent';

const API_BASE = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || '';

/**
 * Safely stringifies any value for rendering in React child elements.
 */
function formatDetailsText(details: any, errorMessage?: any): string {
  if (typeof details === 'string' && details.trim().length > 0) {
    return details;
  }
  if (errorMessage && typeof errorMessage === 'string') {
    return errorMessage;
  }
  if (typeof details === 'object' && details !== null) {
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(', ');
  }
  return 'Operational parameters nominal.';
}

/**
 * Normalizes backend state payload (from FastAPI) into the FullAgentState interface.
 */
export function normalizeBackendState(raw: any): FullAgentState {
  if (!raw) return raw;

  // Normalize capabilities
  const rawCaps = raw.capabilities || {};
  const capabilities: Record<string, Capability> = {};
  for (const [key, val] of Object.entries(rawCaps) as [string, any][]) {
    const status: CapabilityStatus = (val.status || val.state || 'AVAILABLE').toUpperCase();
    const details = formatDetailsText(val.details, val.error_message);

    capabilities[key] = {
      status,
      latency_ms: typeof val.latency_ms === 'number' ? Math.round(val.latency_ms) : 0,
      details,
    };
  }

  // Normalize plan steps
  const rawPlan = raw.plan || [];
  const plan: Step[] = rawPlan.map((s: any, idx: number) => {
    const rawStatus = (s.status || 'PENDING').toUpperCase();
    let status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' = 'PENDING';
    if (rawStatus === 'RUNNING' || rawStatus === 'IN_PROGRESS') status = 'IN_PROGRESS';
    else if (rawStatus === 'COMPLETED') status = 'COMPLETED';
    else if (rawStatus === 'FAILED') status = 'FAILED';

    return {
      step_id: String(s.step_id || s.id || `step-${idx + 1}`),
      title: String(s.title || s.description || `Step #${idx + 1}`),
      status,
      tool: String(s.tool || 'system'),
      is_fallback: Boolean(s.is_fallback || s.tool === 'local_cache'),
      provenance_ref: s.provenance_ref ? String(s.provenance_ref) : s.provenance?.source ? String(s.provenance.source) : null,
      execution_time_ms: s.execution_time_ms,
      error: s.error ? String(s.error) : null,
      params: s.params,
      output: s.output,
      provenance: s.provenance,
    };
  });

  // Normalize mission status
  let missionStatus: FullAgentState['mission']['status'] = 'IDLE';
  if (raw.mission) {
    const rawMsnStatus = (raw.mission.status || 'IDLE').toUpperCase();
    if (rawMsnStatus === 'RUNNING') missionStatus = 'RUNNING';
    else if (rawMsnStatus === 'COMPLETED') missionStatus = 'COMPLETED';
    else if (rawMsnStatus === 'FAILED') missionStatus = 'FAILED';
    else if (rawMsnStatus === 'WAITING_HUMAN' || rawMsnStatus === 'HUMAN_HANDOFF_REQUIRED')
      missionStatus = 'HUMAN_HANDOFF_REQUIRED';
  }

  const mission = {
    id: String(raw.mission?.id || 'msn-idle'),
    objective: String(raw.mission?.objective || 'No mission objective active.'),
    status: missionStatus,
    started_at: raw.mission?.created_at ? new Date(raw.mission.created_at).getTime() : Date.now(),
    updated_at: raw.mission?.updated_at ? new Date(raw.mission.updated_at).getTime() : Date.now(),
  };

  // Normalize metrics
  const rawMetrics = raw.metrics || {};
  const totalSteps = plan.length || rawMetrics.total_steps || 0;
  const completedSteps = plan.filter((s) => s.status === 'COMPLETED').length;
  const toolFailures = rawMetrics.tool_failures ?? rawMetrics.tool_failures_total ?? 0;
  const replansCount = rawMetrics.replans_count ?? rawMetrics.successful_recoveries ?? 0;

  const metrics: Metrics = {
    total_steps: totalSteps,
    completed_steps: completedSteps,
    tool_calls_total: rawMetrics.tool_calls_total ?? (completedSteps + toolFailures),
    tool_failures_total: toolFailures,
    recovery_attempts: rawMetrics.recovery_attempts ?? replansCount,
    successful_recoveries: replansCount,
    human_handoffs: rawMetrics.human_handoffs ?? (missionStatus === 'HUMAN_HANDOFF_REQUIRED' ? 1 : 0),
    pending_actions_count: raw.active_chaos?.length || rawMetrics.pending_actions_count || 0,
    cloud_requests: 0,
    local_processing_pct: 100,
    state_preservation_ok: true,
  };

  // Normalize human handoff
  let human_handoff = raw.human_handoff || null;
  if (!human_handoff && raw.pending_human_request) {
    const req = raw.pending_human_request;
    human_handoff = {
      handoff_id: String(req.step_id || req.mission_id || 'handoff-req-01'),
      reason: String(req.reason || 'Data staleness or low trust detected.'),
      summary: String(req.action_needed || 'Autonomous threshold reached.'),
      known_facts: Array.isArray(req.known_facts) ? req.known_facts.map(String) : ['Local SQLite WAL persistence operational', 'Telemetry cache valid'],
      unknown_facts: Array.isArray(req.unknown_facts) ? req.unknown_facts.map(String) : ['WAN gateway connectivity down', 'Upstream sensor verification'],
      required_human_action: 'Select mitigation strategy to authorize execution.',
      options: Array.isArray(req.options) ? req.options.map(String) : ['PROCEED_WITH_STALE_CACHE', 'FORCE_FALLBACK_REPLAN', 'ABORT_MISSION'],
    };
  }

  // Normalize provenance records
  const provenance = Array.isArray(raw.provenance) ? raw.provenance : [];
  const recovery_log = Array.isArray(raw.recovery_log) ? raw.recovery_log : [];
  const pending_actions = Array.isArray(raw.pending_actions) ? raw.pending_actions : [];

  return {
    mission,
    plan,
    capabilities,
    recovery_log,
    provenance,
    pending_actions,
    metrics,
    human_handoff,
    last_updated: Date.now(),
  };
}

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
    const fallbackRes = await fetch(`${API_BASE}/agent/mission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objective }),
    });
    if (!fallbackRes.ok) {
      const errText = await fallbackRes.text();
      throw new Error(`Failed to start mission: ${errText}`);
    }
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
    const fallbackRes = await fetch(`${API_BASE}/agent/chaos/clear`, { method: 'POST' });
    if (!fallbackRes.ok) {
      const errText = await fallbackRes.text();
      throw new Error(`Failed to restore environment: ${errText}`);
    }
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
    body: JSON.stringify({ handoff_id, decision, action: decision.toLowerCase() }),
  });

  if (!response.ok) {
    const fallbackRes = await fetch(`${API_BASE}/agent/human-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission_id: '', step_id: handoff_id, action: decision.toLowerCase() }),
    });
    if (!fallbackRes.ok) {
      const errText = await fallbackRes.text();
      throw new Error(`Failed to resolve handoff: ${errText}`);
    }
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

  const processPayload = (rawPayload: string) => {
    try {
      if (!rawPayload) return;
      const parsed = JSON.parse(rawPayload);
      const normalized = normalizeBackendState(parsed);
      onUpdate(normalized);
    } catch (err) {
      console.error('[BLACKOUT SSE] Failed to parse agent state stream payload:', err, rawPayload);
    }
  };

  eventSource.onmessage = (event: MessageEvent) => {
    processPayload(event.data);
  };

  eventSource.addEventListener('agent_state', (event: MessageEvent) => {
    processPayload(event.data);
  });

  eventSource.addEventListener('safety_alert', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.warn('[BLACKOUT SSE] Safety alert received:', data);
    } catch (e) {}
  });

  eventSource.onerror = (event: Event) => {
    if (onError) {
      onError(event);
    }
  };

  return () => {
    eventSource.close();
  };
}
