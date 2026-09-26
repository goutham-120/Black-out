/**
 * @file mock_state.ts
 * @description Provides initial and fallback mock data for the BLACKOUT Mission Control UI.
 * Enables offline local-first frontend development and instant rendering when the FastAPI
 * backend SSE stream is connecting, disconnected, or undergoing simulated process restarts.
 */

import { FullAgentState } from '../types/agent';

export const INITIAL_MOCK_STATE: FullAgentState = {
  mission: {
    id: 'msn-8849-blk',
    objective: 'Generate regional grid triage report and verify emergency backup telemetry using local fallbacks.',
    status: 'RUNNING',
    started_at: Date.now() - 145000,
    updated_at: Date.now() - 2500,
  },
  plan: [
    {
      step_id: 'step-01',
      title: 'Probe external weather radar and grid telemetry API',
      status: 'FAILED',
      tool: 'weather_api',
      is_fallback: false,
      provenance_ref: 'prov-weather-remote',
    },
    {
      step_id: 'step-02',
      title: 'Trigger recovery: fallback to local cached radar snapshot',
      status: 'COMPLETED',
      tool: 'local_cache',
      is_fallback: true,
      provenance_ref: 'prov-weather-cache',
    },
    {
      step_id: 'step-03',
      title: 'Sense local sensor database via SQLite WAL replica',
      status: 'COMPLETED',
      tool: 'sqlite_wal',
      is_fallback: false,
      provenance_ref: 'prov-grid-sqlite',
    },
    {
      step_id: 'step-04',
      title: 'Execute local Gemma 4 synthesis for emergency dispatch',
      status: 'IN_PROGRESS',
      tool: 'local_gemma_llm',
      is_fallback: false,
      provenance_ref: null,
    },
    {
      step_id: 'step-05',
      title: 'Persist signed dispatch manifest to local filesystem',
      status: 'PENDING',
      tool: 'filesystem',
      is_fallback: false,
      provenance_ref: null,
    },
  ],
  capabilities: {
    internet: {
      status: 'UNAVAILABLE',
      latency_ms: 0,
      details: 'Connection refused: upstream gateway unreachable (Chaos active).',
    },
    weather_api: {
      status: 'UNAVAILABLE',
      latency_ms: 0,
      details: 'HTTP 503 / DNS timeout via public WAN endpoint.',
    },
    local_cache: {
      status: 'STALE',
      latency_ms: 4,
      details: 'Snapshot valid from 18 minutes ago. Trust score degraded.',
    },
    filesystem: {
      status: 'AVAILABLE',
      latency_ms: 1,
      details: 'Read/write NVMe storage healthy with WAL persistence active.',
    },
    sqlite_wal: {
      status: 'AVAILABLE',
      latency_ms: 2,
      details: 'SQLite 3.42 WAL checkpoint verified at block #1094.',
    },
    local_gemma_llm: {
      status: 'AVAILABLE',
      latency_ms: 42,
      details: 'Quantized Gemma 4 (4-bit) running via local llama.cpp/Ollama.',
    },
    calendar: {
      status: 'DEGRADED',
      latency_ms: 320,
      details: 'Local ICS offline store reachable; remote sync paused.',
    },
  },
  recovery_log: [
    {
      recovery_id: 'rec-101',
      trigger_step_id: 'step-01',
      failed_tool: 'weather_api',
      error_code: 'ERR_NET_UNREACHABLE_HOST',
      options_evaluated: [
        {
          strategy: 'Direct Retry (x3)',
          verdict: 'REJECTED',
          reason: 'Hardware probe confirms WAN interface down; retries would fail.',
        },
        {
          strategy: 'Cloud Secondary API Gateway',
          verdict: 'REJECTED',
          reason: 'Zero cloud egress constraint active in local-first isolation mode.',
        },
        {
          strategy: 'Local Cache Snapshot Fallback',
          verdict: 'ACCEPTED',
          reason: 'Cache contains telemetry within 30-minute staleness threshold.',
        },
        {
          strategy: 'Immediate Human Handoff',
          verdict: 'DEFERRED',
          reason: 'Autonomous fallback strategy viable before human intervention.',
        },
      ],
      selected_strategy: 'Local Cache Snapshot Fallback',
      timestamp: Date.now() - 95000,
    },
  ],
  provenance: [
    {
      data_key: 'prov-weather-cache',
      source: 'local://cache/weather_radar_1042.json',
      timestamp: Date.now() - 1080000,
      age_seconds: 1080,
      status: 'STALE',
      verified: true,
      trust_score: 0.78,
    },
    {
      data_key: 'prov-grid-sqlite',
      source: 'sqlite://data/blackout_state.db?table=substations',
      timestamp: Date.now() - 45000,
      age_seconds: 45,
      status: 'VERIFIED_LIVE',
      verified: true,
      trust_score: 0.99,
    },
    {
      data_key: 'prov-weather-remote',
      source: 'https://api.weather.gov/gridpoints/TOP/31,80/forecast',
      timestamp: Date.now() - 145000,
      age_seconds: 145,
      status: 'UNVERIFIED',
      verified: false,
      trust_score: 0.0,
    },
  ],
  pending_actions: [
    {
      action_id: 'act-901',
      type: 'WRITE_FILE_CHECKPOINT',
      payload: {
        destination: 'artifacts/dispatch_manifest_v1.json',
        checksum_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      created_at: Date.now() - 15000,
      status: 'PENDING_DISK_SYNC',
    },
  ],
  metrics: {
    total_steps: 5,
    completed_steps: 2,
    tool_calls_total: 4,
    tool_failures_total: 1,
    recovery_attempts: 1,
    successful_recoveries: 1,
    human_handoffs: 0,
    pending_actions_count: 1,
    cloud_requests: 0,
    local_processing_pct: 100,
    state_preservation_ok: true,
  },
  human_handoff: null,
  last_updated: Date.now(),
};
