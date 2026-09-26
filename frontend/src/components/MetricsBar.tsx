/**
 * @file MetricsBar.tsx
 * @description Real-time reliability and local-first execution KPI bar for BLACKOUT.
 * Displays local edge processing percentage, step completion rate, recovery success counts,
 * pending action queue volume, and SQLite WAL persistence status.
 */

import React from 'react';
import {
  Cpu,
  CheckCircle,
  ShieldCheck,
  Layers,
  Database,
  CloudOff,
  Zap,
} from 'lucide-react';
import { Metrics } from '../types/agent';

interface MetricsBarProps {
  metrics: Metrics;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics }) => {
  const localPct = metrics?.local_processing_pct ?? 100;
  const totalSteps = metrics?.total_steps ?? 0;
  const completedSteps = metrics?.completed_steps ?? 0;
  const successfulRecoveries = metrics?.successful_recoveries ?? 0;
  const recoveryAttempts = metrics?.recovery_attempts ?? 0;
  const pendingCount = metrics?.pending_actions_count ?? 0;
  const isWalOk = metrics?.state_preservation_ok ?? true;

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md font-mono">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Local-First Processing % */}
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-zinc-900/80 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <div className="p-2 rounded-md bg-cyan-950/80 text-cyan-400 border border-cyan-500/40">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider flex items-center space-x-1">
              <span>Local Processing</span>
              <CloudOff className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-xl font-extrabold text-cyan-300 font-mono tracking-tight">
              {localPct}%
            </div>
          </div>
        </div>

        {/* Plan Step Completion */}
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
          <div className="p-2 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">
              Step Progress
            </div>
            <div className="text-xl font-extrabold text-zinc-100">
              {completedSteps} <span className="text-xs text-zinc-500 font-normal">/ {totalSteps}</span>
            </div>
          </div>
        </div>

        {/* Autonomous Tool Recoveries */}
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-zinc-900/80 border border-purple-500/30">
          <div className="p-2 rounded-md bg-purple-950/80 text-purple-400 border border-purple-500/40">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">
              Recoveries
            </div>
            <div className="text-xl font-extrabold text-purple-300">
              {successfulRecoveries}
              <span className="text-xs text-zinc-500 font-normal"> ({recoveryAttempts} att)</span>
            </div>
          </div>
        </div>

        {/* Pending Action Sync Queue */}
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
          <div className="p-2 rounded-md bg-amber-950/80 text-amber-400 border border-amber-500/40">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">
              Pending Actions
            </div>
            <div className="text-xl font-extrabold text-amber-300">
              {pendingCount} <span className="text-xs text-zinc-500 font-normal">queued</span>
            </div>
          </div>
        </div>

        {/* State Preservation Status */}
        <div className="col-span-2 sm:col-span-1 flex items-center space-x-3 p-3 rounded-lg bg-zinc-900/80 border border-emerald-500/30">
          <div className="p-2 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">
              State Preservation
            </div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-emerald-300">
                {isWalOk ? 'SECURED IN WAL' : 'UNCOMMITTED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
