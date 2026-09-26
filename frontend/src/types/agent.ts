/**
 * @file agent.ts
 * @description Core TypeScript type definitions for the BLACKOUT autonomous agent.
 * Defines the shared schema contract across SENSE, UNDERSTAND, DECIDE, ACT, CHECK,
 * RECOVER, and REPLAN stages of the execution loop.
 */

export type CapabilityStatus = 'AVAILABLE' | 'DEGRADED' | 'STALE' | 'UNAVAILABLE' | 'UNKNOWN';

export interface Capability {
  status: CapabilityStatus;
  latency_ms: number;
  details: string;
}

export interface Step {
  step_id: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  tool: string;
  is_fallback: boolean;
  provenance_ref: string | null;
}

export interface Mission {
  id: string;
  objective: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'HUMAN_HANDOFF_REQUIRED';
  started_at: number;
  updated_at: number;
}

export interface RecoveryOption {
  strategy: string;
  verdict: 'ACCEPTED' | 'REJECTED' | 'DEFERRED';
  reason: string;
}

export interface RecoveryEvent {
  recovery_id: string;
  trigger_step_id: string;
  failed_tool: string;
  error_code: string;
  options_evaluated: RecoveryOption[];
  selected_strategy: string;
  timestamp: number;
}

export interface ProvenanceItem {
  data_key: string;
  source: string;
  timestamp: number;
  age_seconds: number;
  status: 'VERIFIED_LIVE' | 'STALE' | 'UNVERIFIED';
  verified: boolean;
  trust_score: number;
}

export interface PendingAction {
  action_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: number;
  status: string;
}

export interface Metrics {
  total_steps: number;
  completed_steps: number;
  tool_calls_total: number;
  tool_failures_total: number;
  recovery_attempts: number;
  successful_recoveries: number;
  human_handoffs: number;
  pending_actions_count: number;
  cloud_requests: number;
  local_processing_pct: number;
  state_preservation_ok: boolean;
}

export interface HumanHandoff {
  handoff_id: string;
  reason: string;
  summary: string;
  known_facts: string[];
  unknown_facts: string[];
  required_human_action: string;
  options: string[];
}

export interface FullAgentState {
  mission: Mission;
  plan: Step[];
  capabilities: Record<string, Capability>;
  recovery_log: RecoveryEvent[];
  provenance: ProvenanceItem[];
  pending_actions: PendingAction[];
  metrics: Metrics;
  human_handoff: HumanHandoff | null;
  last_updated: number;
}
