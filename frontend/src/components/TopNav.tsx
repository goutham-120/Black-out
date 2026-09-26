/**
 * @file TopNav.tsx
 * @description Global application header for BLACKOUT Mission Control.
 * Displays breadcrumbs, live mission state badge, and quick emergency actions.
 */

import React from 'react';
import {
  Activity,
  RefreshCw,
  Radio,
  Flame,
} from 'lucide-react';
import { FullAgentState } from '../types/agent';
import { PageId } from './Sidebar';

interface TopNavProps {
  activePage: PageId;
  state: FullAgentState;
  isConnected: boolean;
  onRestore: () => void;
  onRestart: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activePage,
  state,
  isConnected,
  onRestore,
  onRestart,
}) => {
  const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Mission Control Dashboard',
      subtitle: 'Real-time telemetry, loop phase tracker, and system overview',
    },
    plan: {
      title: 'Autonomous Plan Tree & Loop',
      subtitle: 'Dynamic step progression and atomic SQLite WAL mutations',
    },
    chaos: {
      title: 'Chaos Switchboard & Capabilities',
      subtitle: 'Deterministic fault injection deck and tool health probes',
    },
    recovery: {
      title: 'Recovery Engine & Strategy Ladder',
      subtitle: 'Gemma 4 replanning reasoning and local fallback transitions',
    },
    provenance: {
      title: 'Data Provenance & Safety Gate',
      subtitle: 'Lineage verification, trust ratings, and persistent audit trail',
    },
    artifacts: {
      title: 'Artifact & Code Workbench',
      subtitle: 'Generated architecture vector SVGs, scripts, and executable test suites',
    },
  };

  const getMissionStatusBadge = (status: FullAgentState['mission']['status']) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35 shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
      case 'FAILED':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/35 shadow-[0_0_12px_rgba(244,63,94,0.3)]';
      case 'HUMAN_HANDOFF_REQUIRED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-bounce';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const current = pageTitles[activePage] || pageTitles.dashboard;

  return (
    <header className="sticky top-0 z-20 h-16 bg-zinc-950/85 border-b border-zinc-800/80 backdrop-blur-2xl px-6 flex items-center justify-between shadow-xl">
      {/* Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
            BLACKOUT
          </span>
          <span className="text-zinc-600">/</span>
          <h1 className="text-sm font-extrabold uppercase tracking-wide text-zinc-100 font-mono">
            {current.title}
          </h1>
        </div>
        <p className="text-[11px] text-zinc-400 font-sans hidden sm:block">
          {current.subtitle}
        </p>
      </div>

      {/* Global Quick Action Toolbar */}
      <div className="flex items-center space-x-2.5 font-mono text-xs">
        {/* Active Mission Badge */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border font-bold uppercase text-[11px] ${getMissionStatusBadge(
            state?.mission?.status || 'IDLE'
          )}`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{state?.mission?.status ? state.mission.status.replace(/_/g, ' ') : 'IDLE'}</span>
        </div>

        {/* Restore nominal systems button */}
        <button
          onClick={onRestore}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.15)]"
          title="Clear all active chaos faults and restore nominal capabilities"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>HEAL ALL</span>
        </button>

        {/* Crash / Restart SIGKILL simulation button */}
        <button
          onClick={onRestart}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30 transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.15)]"
          title="Simulate process crash (SIGKILL) and resume from SQLite WAL checkpoint"
        >
          <Flame className="w-3.5 h-3.5 text-purple-400" />
          <span>SIMULATE SIGKILL</span>
        </button>

        {/* Antigravity MCP Plugin Status Badge */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>ANTIGRAVITY PLUGIN: ARMED</span>
        </div>

        {/* Live SSE stream pulse */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] ${
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
          <span className="hidden sm:inline">
            {isConnected ? 'LIVE SSE' : 'STANDALONE'}
          </span>
        </div>
      </div>
    </header>
  );
};
