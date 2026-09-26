/**
 * @file DashboardPage.tsx
 * @description Mission Control Overview Dashboard for BLACKOUT.
 * Consolidates telemetry metrics, mission objective dispatcher, autonomous loop tracker,
 * and high-level system summaries.
 */

import React from 'react';
import {
  Terminal,
  Play,
  Zap,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { FullAgentState } from '../types/agent';
import { MetricsBar } from '../components/MetricsBar';
import { CapabilityMatrix } from '../components/CapabilityMatrix';
import { PlanTree } from '../components/PlanTree';
import { RecoveryVisualizer } from '../components/RecoveryVisualizer';
import { PageId } from '../components/Sidebar';

interface DashboardPageProps {
  state: FullAgentState;
  newObjective: string;
  setNewObjective: (val: string) => void;
  isSubmitting: boolean;
  onStartMission: (e?: React.FormEvent) => void;
  activeStepId: string | null;
  onNavigate: (page: PageId) => void;
  onTriggerChaos: (target: string, action: string) => void;
  onRestartAgent: () => void;
  onRestore: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  state,
  newObjective,
  setNewObjective,
  isSubmitting,
  onStartMission,
  activeStepId,
  onNavigate,
}) => {
  // Preset mission scenarios for demonstration
  const presetScenarios = [
    'Assess regional blackout impact on telemetry and verify local grid status',
    'Execute off-grid meteorological verification using local sensor cache',
    'Audit critical substation schedules and isolate degraded upstream circuits',
  ];

  const loopPhases = [
    { name: 'SENSE', desc: 'Probe Tools' },
    { name: 'UNDERSTAND', desc: 'Synthesize Env' },
    { name: 'DECIDE', desc: 'Formulate Plan' },
    { name: 'ACT', desc: 'Execute Tool' },
    { name: 'CHECK', desc: 'Safety Gate' },
    { name: 'RECOVER', desc: 'Strategy Ladder' },
    { name: 'REPLAN', desc: 'Gemma 4 Rebuild' },
  ];

  // Determine loop phase highlight
  const currentPhase =
    state.mission?.status === 'RUNNING'
      ? state.plan.some((s) => s.status === 'FAILED')
        ? 'RECOVER'
        : 'ACT'
      : state.mission?.status === 'HUMAN_HANDOFF_REQUIRED'
      ? 'CHECK'
      : state.mission?.status === 'COMPLETED'
      ? 'DECIDE'
      : 'SENSE';

  return (
    <div className="space-y-6">
      {/* Autonomous Mission Dispatcher */}
      <section className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
        <form onSubmit={onStartMission} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-300 uppercase">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Autonomous Mission Dispatcher</span>
              <span className="text-[10px] text-zinc-500">[{state?.mission?.id || 'msn-idle'}]</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Powered by Quantized Local Gemma 4
            </span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder={
                state?.mission?.objective ||
                'Enter autonomous mission objective (e.g. Triage regional grid failure...)'
              }
              className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-95 disabled:opacity-50 font-mono cursor-pointer shrink-0 flex items-center space-x-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSubmitting ? 'DISPATCHING...' : 'DISPATCH MISSION'}</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Presets:</span>
            {presetScenarios.map((scenario, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNewObjective(scenario)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-cyan-300 transition-all font-sans text-left truncate max-w-[340px] cursor-pointer"
              >
                {scenario}
              </button>
            ))}
          </div>
        </form>
      </section>

      {/* Real-time Loop Phase Visualizer */}
      <section className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-400 uppercase">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Continuous Autonomous Loop</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">
            PHASE: {currentPhase}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {loopPhases.map((phase) => {
            const isPhaseActive = phase.name === currentPhase;
            return (
              <div
                key={phase.name}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isPhaseActive
                    ? 'bg-cyan-500/20 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-102'
                    : 'bg-zinc-900/40 border-zinc-800/80 opacity-70'
                }`}
              >
                <div
                  className={`text-xs font-mono font-bold ${
                    isPhaseActive ? 'text-cyan-300' : 'text-zinc-400'
                  }`}
                >
                  {phase.name}
                </div>
                <div className="text-[9px] text-zinc-400 mt-0.5 truncate">{phase.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* KPI Reliability Metrics */}
      <MetricsBar metrics={state?.metrics} />

      {/* 2-Column Overview Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Capability Matrix + Jump to Chaos */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                Probed Environmental Capabilities
              </h2>
              <button
                onClick={() => onNavigate('chaos')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
              >
                <span>Fault Injection Lab</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <CapabilityMatrix capabilities={state?.capabilities || {}} />
          </div>

          {/* Quick Chaos Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-zinc-900/80 to-zinc-950 border border-red-500/20 shadow-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-red-400">
                <Zap className="w-4 h-4" />
                <span>Deterministic Chaos Switchboard</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Click to deterministically kill tools, drop network packets, or simulate hard SIGKILL.
              </p>
            </div>
            <button
              onClick={() => onNavigate('chaos')}
              className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.2)]"
            >
              OPEN SWITCHBOARD
            </button>
          </div>
        </div>

        {/* Right Column: Execution Plan Tree Snapshot + Recovery Engine Preview */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                Active Execution Sequence
              </h2>
              <button
                onClick={() => onNavigate('plan')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
              >
                <span>Full Plan Tree</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <PlanTree plan={state?.plan || []} currentStepId={activeStepId} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                Recent Recovery Decisions
              </h2>
              <button
                onClick={() => onNavigate('recovery')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
              >
                <span>Strategy Ladder</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <RecoveryVisualizer recoveries={state?.recovery_log || []} />
          </div>
        </div>
      </div>
    </div>
  );
};
