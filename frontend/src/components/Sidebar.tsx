/**
 * @file Sidebar.tsx
 * @description Sleek collapsible navigation sidebar for BLACKOUT Mission Control.
 * Provides instant access across all operational modules with live telemetry indicators.
 */

import React from 'react';
import {
  LayoutDashboard,
  GitFork,
  Zap,
  RotateCcw,
  FileCheck2,
  Shield,
  Radio,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  Cpu,
  Code2,
} from 'lucide-react';
import { FullAgentState } from '../types/agent';

export type PageId = 'dashboard' | 'plan' | 'chaos' | 'recovery' | 'provenance' | 'artifacts';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  state: FullAgentState;
  isConnected: boolean;
  onSimulateHandoff: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  artifactsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  state,
  isConnected,
  onSimulateHandoff,
  isCollapsed,
  onToggleCollapse,
  artifactsCount = 3,
}) => {
  const navItems = [
    {
      id: 'dashboard' as PageId,
      label: 'Mission Control',
      subtitle: 'Overview & Telemetry',
      icon: LayoutDashboard,
      badge: state?.mission?.status || 'IDLE',
      badgeColor:
        state?.mission?.status === 'RUNNING'
          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse'
          : state?.mission?.status === 'COMPLETED'
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          : 'bg-zinc-800 text-zinc-400 border-zinc-700',
    },
    {
      id: 'plan' as PageId,
      label: 'Execution Plan',
      subtitle: 'Dynamic Step Tree',
      icon: GitFork,
      badge: `${(state?.plan || []).filter((s) => s.status === 'COMPLETED').length}/${
        (state?.plan || []).length
      }`,
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    },
    {
      id: 'artifacts' as PageId,
      label: 'Artifact Workbench',
      subtitle: 'Code & Vector SVG',
      icon: Code2,
      badge: `${artifactsCount} ITEMS`,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'chaos' as PageId,
      label: 'Chaos Switchboard',
      subtitle: 'Fault Injection Lab',
      icon: Zap,
      badge: Object.values(state?.capabilities || {}).filter(
        (c) => c.status === 'UNAVAILABLE' || c.status === 'DEGRADED'
      ).length
        ? `${
            Object.values(state?.capabilities || {}).filter(
              (c) => c.status === 'UNAVAILABLE' || c.status === 'DEGRADED'
            ).length
          } FAULTS`
        : 'NOMINAL',
      badgeColor: Object.values(state?.capabilities || {}).some(
        (c) => c.status === 'UNAVAILABLE'
      )
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'recovery' as PageId,
      label: 'Recovery Engine',
      subtitle: 'Gemma 4 Strategy Ladder',
      icon: RotateCcw,
      badge: `${(state?.recovery_log || []).length} LOGS`,
      badgeColor:
        (state?.recovery_log || []).length > 0
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          : 'bg-zinc-800 text-zinc-400 border-zinc-700',
    },
    {
      id: 'provenance' as PageId,
      label: 'Data Provenance',
      subtitle: 'Lineage & Safety Gate',
      icon: FileCheck2,
      badge: `${(state?.provenance || []).length} RECS`,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
  ];

  return (
    <aside
      className={`relative z-30 flex flex-col bg-zinc-950/95 border-r border-zinc-800/80 backdrop-blur-2xl transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 h-16">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-black shadow-[0_0_20px_rgba(6,182,212,0.35)] shrink-0">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-extrabold uppercase tracking-wider text-white font-mono">
                  BLACKOUT
                </span>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Gemma 4
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono tracking-tight">
                Local-First Resilience
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
            Operational Modules
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center rounded-xl transition-all duration-150 font-sans cursor-pointer group text-left ${
                isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-3'
              } ${
                isActive
                  ? 'bg-cyan-500/15 text-white border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.18)]'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/70 border border-transparent'
              }`}
              title={isCollapsed ? `${item.label} — ${item.subtitle}` : undefined}
            >
              <div className="flex items-center space-x-3 truncate">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                      : 'bg-zinc-900/80 text-zinc-400 group-hover:text-cyan-400 group-hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <div className="truncate">
                    <div
                      className={`text-xs font-bold font-mono tracking-wide ${
                        isActive ? 'text-cyan-300' : 'text-zinc-200'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate font-sans">
                      {item.subtitle}
                    </div>
                  </div>
                )}
              </div>

              {!isCollapsed && item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border shrink-0 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Safety Gate Test Demo Banner */}
      <div className="p-3 border-t border-zinc-800/80 space-y-2">
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
            <div className="flex items-center space-x-1.5 text-amber-300 text-xs font-mono font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>SAFETY GATE LAB</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Test data staleness & human handoff workflow.
            </p>
            <button
              onClick={onSimulateHandoff}
              className="w-full py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-mono font-bold transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer"
            >
              TRIGGER HANDOFF
            </button>
          </div>
        ) : (
          <button
            onClick={onSimulateHandoff}
            className="w-full p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex justify-center hover:bg-amber-500/25 cursor-pointer"
            title="Trigger Safety Gate Handoff"
          >
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </button>
        )}

        {/* Runtime Diagnostics Footer */}
        <div className="pt-2 text-[10px] font-mono flex items-center justify-between text-zinc-500 px-1">
          <div className="flex items-center space-x-1.5">
            <Radio
              className={`w-2.5 h-2.5 ${
                isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
              }`}
            />
            {!isCollapsed && <span>{isConnected ? 'LIVE SSE' : 'STANDALONE'}</span>}
          </div>
          {!isCollapsed && (
            <div className="flex items-center space-x-2 text-[9px]">
              <span className="flex items-center space-x-1">
                <Database className="w-2.5 h-2.5 text-purple-400" />
                <span>WAL</span>
              </span>
              <span className="flex items-center space-x-1">
                <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                <span>LOCAL</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
