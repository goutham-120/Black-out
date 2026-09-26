/**
 * @file ChaosPage.tsx
 * @description Dedicated Chaos Switchboard & Capability Probing interface for Hackathon Judges.
 * Allows deterministic fault injection into external tools, latency emulation, data corruption,
 * and hard process restart simulation to verify SQLite WAL resilience.
 */

import React from 'react';
import {
  Zap,
  ShieldAlert,
  Flame,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { FullAgentState } from '../types/agent';
import { ChaosControls } from '../components/ChaosControls';
import { CapabilityMatrix } from '../components/CapabilityMatrix';

interface ChaosPageProps {
  state: FullAgentState;
  onTriggerChaos: (target: string, action: string) => void;
  onRestartAgent: () => void;
  onRestore: () => void;
}

export const ChaosPage: React.FC<ChaosPageProps> = ({
  state,
  onTriggerChaos,
  onRestartAgent,
  onRestore,
}) => {
  const degradedCount = Object.values(state?.capabilities || {}).filter(
    (c) => c.status === 'DEGRADED' || c.status === 'UNAVAILABLE'
  ).length;

  return (
    <div className="space-y-6">
      {/* Judge's Mission Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-red-500/15 via-zinc-950 to-zinc-950 border border-red-500/30 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-red-400 uppercase">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Judge's Deterministic Chaos Desk</span>
          </div>
          <h2 className="text-sm font-extrabold text-white font-mono">
            Environmental Stress-Testing & Tool Dropout Simulation
          </h2>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            Trigger deterministic hardware, network, or data faults mid-mission. Observe the agent intercept
            the execution error, evaluate the Strategy Ladder, and dynamically replan without hallucinating.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRestore}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>HEAL ALL SYSTEMS</span>
          </button>
        </div>
      </div>

      {/* 2-Column Chaos & Capabilities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chaos Control Deck (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-300 uppercase">
              <Zap className="w-4 h-4 text-red-400" />
              <span>Deterministic Fault Injectors</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              Interceptors wrap every tool
            </span>
          </div>

          <ChaosControls
            onTriggerChaos={onTriggerChaos}
            onRestartAgent={onRestartAgent}
            onRestore={onRestore}
          />
        </div>

        {/* Right Column: Real-time Capability Health Matrix (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-300 uppercase">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Real-time Capability Health Probing</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                degradedCount > 0
                  ? 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {degradedCount > 0 ? `${degradedCount} DEGRADED` : 'ALL NOMINAL'}
            </span>
          </div>

          <CapabilityMatrix capabilities={state?.capabilities || {}} />

          {/* Hard Process Crash Test Card */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-purple-500/30 shadow-xl backdrop-blur-xl space-y-3">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-mono font-bold">
              <Flame className="w-4 h-4" />
              <span>SIGKILL Process Crash & Resumption Test</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Click below to simulate immediate process termination during mission execution.
              Because all steps and plan mutations are journaled to SQLite in WAL mode before execution,
              restarting seamlessly resumes from the exact last checkpoint without data loss.
            </p>
            <button
              onClick={onRestartAgent}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.25)] flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-purple-400" />
              <span>TRIGGER SIGKILL PROCESS RESTART</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
