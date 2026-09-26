/**
 * @file RecoveryPage.tsx
 * @description Dedicated Recovery Engine & Gemma 4 Strategy Ladder page.
 * Displays the 4-tier decision ladder, detailed recovery reasoning, dynamic replan mutations,
 * and Safety Gate human handoff triggers.
 */

import React from 'react';
import {
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  Cpu,
  Layers,
} from 'lucide-react';
import { FullAgentState } from '../types/agent';
import { RecoveryVisualizer } from '../components/RecoveryVisualizer';

interface RecoveryPageProps {
  state: FullAgentState;
  onSimulateHandoff: () => void;
}

export const RecoveryPage: React.FC<RecoveryPageProps> = ({
  state,
  onSimulateHandoff,
}) => {
  const ladderTiers = [
    {
      tier: 'Tier 1',
      name: 'Transient Retry',
      desc: 'Allowed only for transient timeouts. Bypassed immediately if subsystem is hard-killed.',
      icon: RotateCcw,
      color: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    },
    {
      tier: 'Tier 2',
      name: 'Alt-Tool Swap',
      desc: 'Gemma 4 selects an operational peer tool (e.g. airport METAR sensor vs cloud weather API).',
      icon: Layers,
      color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    },
    {
      tier: 'Tier 3',
      name: 'Local-First Fallback',
      desc: 'Extract verified offline baseline from SQLite WAL cache or local NVMe file storage.',
      icon: Cpu,
      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    },
    {
      tier: 'Tier 4',
      name: 'Human Handoff',
      desc: 'Halts execution at Safety Gate when critical telemetry is too stale or trust score is low.',
      icon: AlertTriangle,
      color: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Strategy Ladder Explanation Card */}
      <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-300 uppercase">
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Gemma 4 Resilience Strategy Ladder</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Zero Hallucinations Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ladderTiers.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${item.color} space-y-2 relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider opacity-80">
                    {item.tier}
                  </span>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold font-mono text-white">{item.name}</div>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Recovery Log & Safety Gate Test Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recovery Log Feed (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-300 uppercase">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Fault Interceptions & Decision Audits</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Total Logged: {(state?.recovery_log || []).length}
            </span>
          </div>

          <RecoveryVisualizer recoveries={state?.recovery_log || []} />
        </div>

        {/* Safety Gate Test Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-amber-500/30 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-300 uppercase">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Safety Gate & Staleness Threshold</span>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              When data staleness exceeds 1 hour or the provenance trust score drops below 0.50,
              BLACKOUT strictly refuses to hallucinate and pauses execution for human-in-the-loop authorization.
            </p>
            <button
              onClick={onSimulateHandoff}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center space-x-2 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>SIMULATE SAFETY GATE HANDOFF</span>
            </button>
          </div>

          {/* Recovery KPIs */}
          <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl shadow-xl space-y-3">
            <div className="text-xs font-mono font-bold text-zinc-300 uppercase">
              Resilience Performance
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Total Interceptions:</span>
                <span className="text-white font-bold">{state?.metrics?.tool_failures_total ?? 0}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Successful Replans:</span>
                <span className="text-emerald-400 font-bold">{state?.metrics?.successful_recoveries ?? 0}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Gemma 4 Accuracy:</span>
                <span className="text-cyan-300 font-bold">100% Valid JSON</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
