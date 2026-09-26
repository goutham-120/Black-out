/**
 * @file App.tsx
 * @description Master Mission Control UI for BLACKOUT.
 * Integrates real-time SSE stream telemetry, capability matrix probes, chaos fault injectors,
 * dynamic plan tree visualization, Gemma 4 recovery decision ladders, data provenance tracking,
 * and Safety Gate human handoff workflows. Fully reactive in both live SSE and standalone modes.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Activity,
  Terminal,
  Play,
  Layers,
  Radio,
  AlertTriangle,
} from 'lucide-react';
import { FullAgentState, Step, RecoveryEvent } from './types/agent';
import { INITIAL_MOCK_STATE } from './data/mock_state';
import {
  subscribeToAgentStream,
  startMission,
  triggerChaos,
  restartAgent,
  restoreEnvironment,
  resolveHandoff,
} from './services/api';
import { CapabilityMatrix } from './components/CapabilityMatrix';
import { ChaosControls } from './components/ChaosControls';
import { PlanTree } from './components/PlanTree';
import { RecoveryVisualizer } from './components/RecoveryVisualizer';
import { ProvenanceInspector } from './components/ProvenanceInspector';
import { HumanHandoffModal } from './components/HumanHandoffModal';
import { MetricsBar } from './components/MetricsBar';

export const App: React.FC = () => {
  const [state, setState] = useState<FullAgentState>(INITIAL_MOCK_STATE);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [newObjective, setNewObjective] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  // Simulation timer reference for realistic offline step execution
  const simTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to SSE Stream on Mount with automatic fallback
  useEffect(() => {
    let fallbackActive = false;

    const unsubscribe = subscribeToAgentStream(
      (newState) => {
        setIsConnected(true);
        setState(newState);
      },
      () => {
        setIsConnected(false);
        if (!fallbackActive) {
          fallbackActive = true;
          console.warn('[BLACKOUT UI] Operating on standalone interactive engine.');
        }
      }
    );

    return () => {
      unsubscribe();
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
    };
  }, []);

  // Update active step ID from state
  useEffect(() => {
    const inProg = state.plan.find((s) => s.status === 'IN_PROGRESS');
    if (inProg) {
      setActiveStepId(inProg.step_id);
    } else {
      setActiveStepId(null);
    }
  }, [state.plan]);

  // Offline interactive mission execution simulation
  const runOfflineMissionSimulation = (objective: string) => {
    if (simTimerRef.current) clearTimeout(simTimerRef.current);

    const initialPlan: Step[] = [
      {
        step_id: 'step-01',
        title: 'Probe external weather radar and grid telemetry API',
        status: 'IN_PROGRESS',
        tool: 'weather_api',
        is_fallback: false,
        provenance_ref: 'prov-weather-remote',
      },
      {
        step_id: 'step-02',
        title: 'Sense local sensor database via SQLite WAL replica',
        status: 'PENDING',
        tool: 'sqlite_wal',
        is_fallback: false,
        provenance_ref: 'prov-grid-sqlite',
      },
      {
        step_id: 'step-03',
        title: 'Execute local Gemma 4 synthesis for emergency dispatch',
        status: 'PENDING',
        tool: 'local_gemma_llm',
        is_fallback: false,
        provenance_ref: null,
      },
      {
        step_id: 'step-04',
        title: 'Persist signed dispatch manifest to local filesystem',
        status: 'PENDING',
        tool: 'filesystem',
        is_fallback: false,
        provenance_ref: null,
      },
    ];

    setState((prev) => ({
      ...prev,
      mission: {
        id: `msn-${Math.floor(1000 + Math.random() * 9000)}-blk`,
        objective,
        status: 'RUNNING',
        started_at: Date.now(),
        updated_at: Date.now(),
      },
      plan: initialPlan,
      metrics: {
        ...prev.metrics,
        total_steps: initialPlan.length,
        completed_steps: 0,
      },
    }));

    // Step 1: Probe Weather
    simTimerRef.current = setTimeout(() => {
      setState((prev) => {
        const isWeatherUnavailable = prev.capabilities.weather_api?.status === 'UNAVAILABLE';
        
        if (isWeatherUnavailable) {
          // Tool failed -> trigger RECOVER & dynamic REPLAN
          const recoveryEvent: RecoveryEvent = {
            recovery_id: `rec-${Date.now()}`,
            trigger_step_id: 'step-01',
            failed_tool: 'weather_api',
            error_code: 'ERR_NET_UNREACHABLE_HOST',
            options_evaluated: [
              {
                strategy: 'Direct Remote Retry',
                verdict: 'REJECTED',
                reason: 'Network gateway confirmed offline; retries suppressed.',
              },
              {
                strategy: 'Local Cache Snapshot Fallback',
                verdict: 'ACCEPTED',
                reason: 'Cache contains verified telemetry within 30-min threshold.',
              },
              {
                strategy: 'Safety Gate Operator Intercept',
                verdict: 'DEFERRED',
                reason: 'Autonomous local fallback available without operator interruption.',
              },
            ],
            selected_strategy: 'Local Cache Snapshot Fallback',
            timestamp: Date.now(),
          };

          const mutatedPlan: Step[] = [
            {
              step_id: 'step-01',
              title: 'Probe external weather radar and grid telemetry API',
              status: 'FAILED',
              tool: 'weather_api',
              is_fallback: false,
              provenance_ref: 'prov-weather-remote',
            },
            {
              step_id: 'step-01-fb',
              title: 'Dynamic Fallback: Ingest local cached radar snapshot',
              status: 'IN_PROGRESS',
              tool: 'local_cache',
              is_fallback: true,
              provenance_ref: 'prov-weather-cache',
            },
            ...prev.plan.slice(1),
          ];

          return {
            ...prev,
            plan: mutatedPlan,
            recovery_log: [recoveryEvent, ...prev.recovery_log],
            metrics: {
              ...prev.metrics,
              total_steps: mutatedPlan.length,
              tool_failures_total: prev.metrics.tool_failures_total + 1,
              recovery_attempts: prev.metrics.recovery_attempts + 1,
              successful_recoveries: prev.metrics.successful_recoveries + 1,
            },
          };
        } else {
          // Step 1 succeeded normally
          return {
            ...prev,
            plan: prev.plan.map((s, idx) =>
              idx === 0 ? { ...s, status: 'COMPLETED' } : idx === 1 ? { ...s, status: 'IN_PROGRESS' } : s
            ),
            metrics: { ...prev.metrics, completed_steps: 1 },
          };
        }
      });

      // Step 2 & 3 Execution
      simTimerRef.current = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          plan: prev.plan.map((s) => {
            if (s.status === 'IN_PROGRESS') return { ...s, status: 'COMPLETED' };
            if (s.step_id === 'step-02') return { ...s, status: 'IN_PROGRESS' };
            return s;
          }),
          metrics: {
            ...prev.metrics,
            completed_steps: prev.plan.filter((s) => s.status === 'COMPLETED').length + 1,
          },
        }));

        // Final Steps Succeeded
        simTimerRef.current = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            mission: { ...prev.mission, status: 'COMPLETED', updated_at: Date.now() },
            plan: prev.plan.map((s) => ({
              ...s,
              status: s.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
            })),
            metrics: {
              ...prev.metrics,
              completed_steps: prev.plan.filter((s) => s.status !== 'FAILED').length,
            },
          }));
        }, 1500);
      }, 1500);
    }, 1200);
  };

  // Handler: Start new mission
  const handleStartMission = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const objective = newObjective.trim() || 'Generate regional grid triage report and verify emergency backup telemetry.';
    setIsSubmitting(true);
    try {
      if (isConnected) {
        await startMission(objective);
      } else {
        runOfflineMissionSimulation(objective);
      }
      setNewObjective('');
    } catch (err) {
      console.error('Failed to start mission:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Trigger Chaos
  const handleTriggerChaos = async (target: string, action: string) => {
    try {
      if (isConnected) {
        await triggerChaos(target, action);
      } else {
        // Standalone interactive simulation
        setState((prev) => {
          const updatedCapabilities = { ...prev.capabilities };
          if (updatedCapabilities[target]) {
            const isDisabling = action === 'DISABLE' || action === 'CLEAR';
            updatedCapabilities[target] = {
              ...updatedCapabilities[target],
              status: isDisabling ? 'UNAVAILABLE' : 'DEGRADED',
              latency_ms: isDisabling ? 0 : 450,
              details: `Simulated fault (${action}) injected via Switchboard.`,
            };
          }

          // If internet or weather was cut, add immediate recovery diagnostic
          const newRecovery: RecoveryEvent = {
            recovery_id: `rec-${Date.now()}`,
            trigger_step_id: activeStepId || 'step-active',
            failed_tool: target,
            error_code: `ERR_CHAOS_${action}_INJECTED`,
            options_evaluated: [
              {
                strategy: 'Direct Remote Retry',
                verdict: 'REJECTED',
                reason: `Interception probe confirmed ${target} disrupted.`,
              },
              {
                strategy: 'Local Cache / SQLite WAL Fallback',
                verdict: 'ACCEPTED',
                reason: 'Local offline replica accessible with verified telemetry.',
              },
            ],
            selected_strategy: 'Local Cache / SQLite WAL Fallback',
            timestamp: Date.now(),
          };

          return {
            ...prev,
            capabilities: updatedCapabilities,
            recovery_log: [newRecovery, ...prev.recovery_log],
            metrics: {
              ...prev.metrics,
              tool_failures_total: prev.metrics.tool_failures_total + 1,
              recovery_attempts: prev.metrics.recovery_attempts + 1,
              successful_recoveries: prev.metrics.successful_recoveries + 1,
            },
          };
        });
      }
    } catch (err) {
      console.error('Failed to trigger chaos:', err);
    }
  };

  // Handler: Restart Agent process (SIGKILL test)
  const handleRestartAgent = async () => {
    try {
      if (isConnected) {
        await restartAgent();
      } else {
        // Flash restart state
        setState((prev) => ({
          ...prev,
          mission: { ...prev.mission, status: 'RUNNING', updated_at: Date.now() },
          metrics: { ...prev.metrics, state_preservation_ok: true },
        }));
      }
    } catch (err) {
      console.error('Failed to restart agent:', err);
    }
  };

  // Handler: Restore Environment
  const handleRestoreEnvironment = async () => {
    try {
      if (isConnected) {
        await restoreEnvironment();
      } else {
        setState(INITIAL_MOCK_STATE);
      }
    } catch (err) {
      console.error('Failed to restore environment:', err);
    }
  };

  // Handler: Trigger Safety Gate Human Handoff modal for demonstration
  const handleSimulateHandoff = () => {
    setState((prev) => ({
      ...prev,
      mission: { ...prev.mission, status: 'HUMAN_HANDOFF_REQUIRED' },
      human_handoff: {
        handoff_id: `handoff-${Date.now()}`,
        reason: 'Staleness threshold exceeded on emergency radar snapshot (Age: 18m, Trust: 78%).',
        summary: 'Agent requires human authorization before executing irreversible regional power isolation switch.',
        known_facts: [
          'SQLite WAL state persistence confirmed',
          'Substation telemetry verified at block #1094',
          'Local NVMe filesystem healthy',
        ],
        unknown_facts: [
          'Upstream WAN weather radar telemetry currently unreachable',
          'High storm intensity delta undetected in last 15 minutes',
        ],
        required_human_action: 'Authorize proceeding with cached telemetry or force manual operator override.',
        options: ['PROCEED_WITH_STALE_CACHE', 'PROVIDE_MANUAL_INPUT', 'ABORT_MISSION'],
      },
    }));
  };

  // Handler: Resolve Human Handoff
  const handleResolveHandoff = async (decision: string) => {
    try {
      if (state.human_handoff) {
        if (isConnected) {
          await resolveHandoff(state.human_handoff.handoff_id, decision);
        }
        setState((prev) => ({
          ...prev,
          human_handoff: null,
          mission: {
            ...prev.mission,
            status: decision === 'ABORT_MISSION' ? 'FAILED' : 'RUNNING',
          },
        }));
      }
    } catch (err) {
      console.error('Failed to resolve handoff:', err);
    }
  };

  const getMissionStatusBadge = (status: FullAgentState['mission']['status']) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.3)]';
      case 'HUMAN_HANDOFF_REQUIRED':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-bounce';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Mission Control Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 border-b border-zinc-800/80 backdrop-blur-2xl px-6 py-3 shadow-xl">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Agent Tagline */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold uppercase tracking-wider text-white font-mono">
                  BLACKOUT
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Gemma 4 Local-First
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  WAL Resilient
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                Autonomous SENSE → UNDERSTAND → DECIDE → ACT → RECOVER Loop
              </p>
            </div>
          </div>

          {/* Quick Demo Triggers & Connection Status */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            {/* Interactive Safety Gate trigger */}
            <button
              onClick={handleSimulateHandoff}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 transition-all shadow-[0_0_10px_rgba(245,158,11,0.15)]"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>TEST SAFETY GATE</span>
            </button>

            {/* Connection Status indicator */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-[11px] ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}
            >
              <Radio
                className={`w-3 h-3 ${
                  isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
                }`}
              />
              <span>{isConnected ? 'LIVE SSE STREAM' : 'STANDALONE ENGINE'}</span>
            </div>

            {/* Mission Status Badge */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border font-bold uppercase text-[11px] ${getMissionStatusBadge(
                state.mission.status
              )}`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{state.mission.status.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-5 space-y-5">
        {/* Mission Objective Bar */}
        <section className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
          <form
            onSubmit={handleStartMission}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center space-x-2 text-[11px] font-mono font-bold text-zinc-400 uppercase mb-1">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Active Mission Objective</span>
                <span className="text-[10px] text-zinc-500">[{state.mission.id}]</span>
              </div>
              <input
                type="text"
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder={state.mission.objective || 'Enter mission objective...'}
                className="w-full bg-zinc-900/70 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-50 font-mono"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Mission'}</span>
            </button>
          </form>
        </section>

        {/* Reliability KPI Bar */}
        <section>
          <MetricsBar metrics={state.metrics} />
        </section>

        {/* 2-Column Balanced Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN (5 Cols): Capability Matrix + Chaos Desk + Pending Actions */}
          <div className="xl:col-span-5 space-y-5">
            <CapabilityMatrix capabilities={state.capabilities} />
            <ChaosControls
              onTriggerChaos={handleTriggerChaos}
              onRestartAgent={handleRestartAgent}
              onRestore={handleRestoreEnvironment}
            />

            {/* Pending Actions / WAL Sync Queue Card */}
            <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-800/80">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-mono">
                      Pending Action Sync Queue
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-sans">Atomic SQLite WAL mutations</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-amber-300 font-mono font-bold">
                  {state.pending_actions.length} QUEUED
                </span>
              </div>

              {state.pending_actions.length === 0 ? (
                <div className="py-6 text-center text-zinc-500 text-xs font-mono border border-dashed border-zinc-800 rounded-xl">
                  No actions pending disk sync.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {state.pending_actions.map((act) => (
                    <div
                      key={act.action_id}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 font-mono text-xs">{act.type}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono">
                          {act.status}
                        </span>
                      </div>
                      <div className="bg-zinc-950/80 p-2 rounded-lg text-[10px] text-zinc-400 font-mono truncate">
                        {JSON.stringify(act.payload)}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                        <span>ID: {act.action_id}</span>
                        <span>{new Date(act.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (7 Cols): Plan Tree + Recovery Ladder + Provenance Inspector */}
          <div className="xl:col-span-7 space-y-5">
            <PlanTree plan={state.plan} currentStepId={activeStepId} />
            <RecoveryVisualizer recoveries={state.recovery_log} />
            <ProvenanceInspector provenance={state.provenance} />
          </div>
        </div>
      </main>

      {/* Human Handoff Safety Gate Modal */}
      <HumanHandoffModal
        handoff={state.human_handoff}
        onResolve={handleResolveHandoff}
      />
    </div>
  );
};

export default App;
