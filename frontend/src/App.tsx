/**
 * @file App.tsx
 * @description Master Mission Control UI for BLACKOUT.
 * Integrates real-time SSE stream telemetry, capability matrix probes, chaos fault injectors,
 * dynamic plan tree visualization, Gemma 4 recovery decision ladders, data provenance tracking,
 * and Safety Gate human handoff workflows.
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Terminal,
  Play,
  Layers,
  Clock,
  Radio,
  RefreshCw,
  Cpu,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { FullAgentState } from './types/agent';
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
          console.warn('[BLACKOUT UI] Backend stream offline; operating on Local-First Mock state.');
        }
      }
    );

    return () => {
      unsubscribe();
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

  // Handler: Start new mission
  const handleStartMission = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const objective = newObjective.trim() || 'Execute localized emergency power grid diagnosis and recovery.';
    setIsSubmitting(true);
    try {
      if (isConnected) {
        await startMission(objective);
      } else {
        // Offline simulation update
        setState((prev) => ({
          ...prev,
          mission: {
            id: `msn-${Math.floor(1000 + Math.random() * 9000)}-local`,
            objective,
            status: 'RUNNING',
            started_at: Date.now(),
            updated_at: Date.now(),
          },
          plan: [
            {
              step_id: 'step-01',
              title: 'Probe external grid endpoints',
              status: 'IN_PROGRESS',
              tool: 'weather_api',
              is_fallback: false,
              provenance_ref: null,
            },
            {
              step_id: 'step-02',
              title: 'Sense local SQLite sensor telemetry',
              status: 'PENDING',
              tool: 'sqlite_wal',
              is_fallback: false,
              provenance_ref: null,
            },
            {
              step_id: 'step-03',
              title: 'Synthesize local Gemma 4 diagnosis',
              status: 'PENDING',
              tool: 'local_gemma_llm',
              is_fallback: false,
              provenance_ref: null,
            },
          ],
          metrics: {
            ...prev.metrics,
            total_steps: 3,
            completed_steps: 0,
          },
        }));
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
        // Local offline simulation
        setState((prev) => {
          const updatedCapabilities = { ...prev.capabilities };
          if (updatedCapabilities[target]) {
            updatedCapabilities[target] = {
              ...updatedCapabilities[target],
              status: action === 'DISABLE' ? 'UNAVAILABLE' : 'DEGRADED',
              details: `Simulated chaos: ${action} injected via Mission Control.`,
            };
          }
          return {
            ...prev,
            capabilities: updatedCapabilities,
            recovery_log: [
              {
                recovery_id: `rec-${Date.now()}`,
                trigger_step_id: activeStepId || 'step-01',
                failed_tool: target,
                error_code: `ERR_CHAOS_${action}`,
                options_evaluated: [
                  {
                    strategy: 'Direct Remote Retry',
                    verdict: 'REJECTED',
                    reason: `Interception probe confirmed ${target} disrupted.`,
                  },
                  {
                    strategy: 'Local Cache / SQLite Fallback',
                    verdict: 'ACCEPTED',
                    reason: 'Local offline replica accessible with valid telemetry.',
                  },
                ],
                selected_strategy: 'Local Cache / SQLite Fallback',
                timestamp: Date.now(),
              },
              ...prev.recovery_log,
            ],
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
        setState((prev) => ({
          ...prev,
          mission: {
            ...prev.mission,
            status: 'RUNNING',
            updated_at: Date.now(),
          },
          metrics: {
            ...prev.metrics,
            state_preservation_ok: true,
          },
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
            status: 'RUNNING',
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
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.4)] animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
      case 'FAILED':
        return 'bg-rose-950 text-rose-300 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.4)]';
      case 'HUMAN_HANDOFF_REQUIRED':
        return 'bg-amber-950 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-bounce';
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Mission Control Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 border-b border-zinc-800/80 backdrop-blur-xl px-6 py-3.5 shadow-2xl">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Agent Tagline */}
          <div className="flex items-center space-x-3.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] font-mono font-black text-lg">
              <Shield className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg font-black uppercase tracking-wider text-white font-mono">
                  BLACKOUT
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-cyan-400 border border-cyan-500/40">
                  Gemma 4 Local-First
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-900 text-purple-400 border border-purple-500/40">
                  WAL Resilient
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Autonomous SENSE → UNDERSTAND → DECIDE → ACT → RECOVER Loop
              </p>
            </div>
          </div>

          {/* Connection Status & Mission Badge */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Live SSE vs Offline Mock indicator */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
                isConnected
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-zinc-900/90 text-amber-300 border-amber-500/40'
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
                }`}
              />
              <span>{isConnected ? 'LIVE SSE STREAM' : 'LOCAL MOCK STANDALONE'}</span>
            </div>

            {/* Mission Status Badge */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-bold uppercase ${getMissionStatusBadge(
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
        {/* Mission Objective Bar & Quick Trigger Form */}
        <section className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 shadow-xl backdrop-blur-md font-mono">
          <form
            onSubmit={handleStartMission}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center space-x-2 text-xs font-bold text-zinc-400 uppercase mb-1">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Active Mission Objective</span>
                <span className="text-[10px] text-zinc-500">[{state.mission.id}]</span>
              </div>
              <input
                type="text"
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder={state.mission.objective || 'Enter new mission objective...'}
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-lg px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Mission'}</span>
            </button>
          </form>
        </section>

        {/* Global Reliability KPI Bar */}
        <section>
          <MetricsBar metrics={state.metrics} />
        </section>

        {/* 3-Column Core Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN (4 Cols): Capability Matrix + Chaos Switchboard */}
          <div className="lg:col-span-4 space-y-5">
            <CapabilityMatrix capabilities={state.capabilities} />
            <ChaosControls
              onTriggerChaos={handleTriggerChaos}
              onRestartAgent={handleRestartAgent}
              onRestore={handleRestoreEnvironment}
            />
          </div>

          {/* CENTER COLUMN (5 Cols): Dynamic Plan Tree + Recovery Visualizer */}
          <div className="lg:col-span-5 space-y-5">
            <PlanTree plan={state.plan} currentStepId={activeStepId} />
            <RecoveryVisualizer recoveries={state.recovery_log} />
          </div>

          {/* RIGHT COLUMN (3 Cols): Provenance Lineage + Pending Actions */}
          <div className="lg:col-span-3 space-y-5">
            <ProvenanceInspector provenance={state.provenance} />

            {/* Pending Actions / WAL Sync Queue Box */}
            <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 shadow-2xl backdrop-blur-md font-mono">
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-800/80">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100">
                      Pending Action Sync Queue
                    </h3>
                    <p className="text-[10px] text-zinc-500">Atomic WAL state mutations</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-amber-300 font-bold">
                  {state.pending_actions.length} QUEUED
                </span>
              </div>

              {state.pending_actions.length === 0 ? (
                <div className="py-6 text-center text-zinc-500 text-[11px] border border-dashed border-zinc-800 rounded-lg">
                  No actions pending disk sync.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {state.pending_actions.map((act) => (
                    <div
                      key={act.action_id}
                      className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800/80 text-[11px] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-xs">{act.type}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                          {act.status}
                        </span>
                      </div>
                      <div className="bg-zinc-950 p-2 rounded text-[10px] text-zinc-400 font-mono truncate">
                        {JSON.stringify(act.payload)}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                        <span>ID: {act.action_id}</span>
                        <span>{new Date(act.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
