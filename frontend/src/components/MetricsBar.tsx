/**
 * @file MetricsBar.tsx
 * @description Real-time reliability and local-first execution KPI bar for BLACKOUT.
 */

import React from 'react';
import {
  Cpu,
  CheckCircle,
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
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* Local-First Processing % */}
      <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-zinc-950/80 border border-cyan-500/20 shadow-lg backdrop-blur-xl">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase text-zinc-400 font-mono font-semibold tracking-wider flex items-center space-x-1 truncate">
            <span>Local Core</span>
            <CloudOff className="w-2.5 h-2.5 text-cyan-400" />
          </div>
          <div className="text-lg font-black text-cyan-300 font-mono tracking-tight">
            {localPct}%
          </div>
        </div>
      </div>

      {/* Plan Step Progress */}
      <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-lg backdrop-blur-xl">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
          <CheckCircle className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase text-zinc-400 font-mono font-semibold tracking-wider truncate">
            Step Progress
          </div>
          <div className="text-lg font-black text-zinc-100 font-mono">
            {completedSteps} <span className="text-xs text-zinc-500 font-normal">/ {totalSteps}</span>
          </div>
        </div>
      </div>

      {/* Autonomous Tool Recoveries */}
      <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-zinc-950/80 border border-purple-500/20 shadow-lg backdrop-blur-xl">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0">
          <Zap className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase text-zinc-400 font-mono font-semibold tracking-wider truncate">
            Recoveries
          </div>
          <div className="text-lg font-black text-purple-300 font-mono">
            {successfulRecoveries}
            <span className="text-xs text-zinc-500 font-normal"> ({recoveryAttempts} att)</span>
          </div>
        </div>
      </div>

      {/* Pending Action Sync Queue */}
      <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-lg backdrop-blur-xl">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
          <Layers className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase text-zinc-400 font-mono font-semibold tracking-wider truncate">
            Pending Sync
          </div>
          <div className="text-lg font-black text-amber-300 font-mono">
            {pendingCount} <span className="text-xs text-zinc-500 font-normal">queued</span>
          </div>
        </div>
      </div>

      {/* State Preservation Status */}
      <div className="col-span-2 sm:col-span-1 flex items-center space-x-3 p-3.5 rounded-2xl bg-zinc-950/80 border border-emerald-500/20 shadow-lg backdrop-blur-xl">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
          <Database className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase text-zinc-400 font-mono font-semibold tracking-wider truncate">
            State Persistence
          </div>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-300 font-mono truncate">
              {isWalOk ? 'SECURED IN WAL' : 'UNCOMMITTED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
