/**
 * @file ChaosControls.tsx
 * @description Tactical Chaos Switchboard for BLACKOUT.
 * Allows judges and operators to inject deterministic environmental faults (network cuts,
 * cache purging, file corruption, hard process crashes) to force the RECOVER & REPLAN loop.
 */

import React, { useState } from 'react';
import {
  WifiOff,
  CloudOff,
  CalendarX,
  FileWarning,
  Trash2,
  ZapOff,
  RotateCcw,
  AlertTriangle,
  Flame,
  Radio,
} from 'lucide-react';

interface ChaosControlsProps {
  onTriggerChaos: (target: string, action: string) => void;
  onRestartAgent: () => void;
  onRestore: () => void;
}

interface ActionFeedback {
  id: string;
  label: string;
  time: number;
}

export const ChaosControls: React.FC<ChaosControlsProps> = ({
  onTriggerChaos,
  onRestartAgent,
  onRestore,
}) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [recentActions, setRecentActions] = useState<ActionFeedback[]>([]);

  const handleAction = async (id: string, label: string, fn: () => void | Promise<void>) => {
    setActiveAction(id);
    setRecentActions((prev) => [
      { id, label, time: Date.now() },
      ...prev.slice(0, 3),
    ]);

    try {
      await fn();
    } finally {
      setTimeout(() => {
        setActiveAction((curr) => (curr === id ? null : curr));
      }, 600);
    }
  };

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Accent top gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 opacity-80" />

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                Chaos Switchboard
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-red-950/80 text-rose-400 border border-rose-500/40">
                Fault Injection Desk
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Trigger deterministic environment failures to test autonomous recovery &amp; replanning
            </p>
          </div>
        </div>

        {/* Global Restore Action */}
        <button
          onClick={() => handleAction('restore', 'Restored Environment', onRestore)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase transition-all duration-200 border ${
            activeAction === 'restore'
              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-95'
              : 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border-emerald-500/40 hover:border-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
          }`}
        >
          <RotateCcw
            className={`w-4 h-4 ${activeAction === 'restore' ? 'animate-spin' : ''}`}
          />
          <span>Restore All Capabilities</span>
        </button>
      </div>

      {/* Button Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Kill Internet */}
        <button
          onClick={() =>
            handleAction('kill_net', 'Killed Internet Gateway', () =>
              onTriggerChaos('internet', 'DISABLE')
            )
          }
          className={`group flex flex-col justify-between p-3.5 rounded-lg border text-left transition-all duration-150 font-mono ${
            activeAction === 'kill_net'
              ? 'bg-rose-900/90 border-rose-400 text-white scale-95 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
              : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-rose-500/50 text-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded bg-rose-950/80 border border-rose-500/30 text-rose-400 group-hover:scale-110 transition-transform">
              <WifiOff className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">NET-CUT</span>
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-200 group-hover:text-rose-300">
              Kill Internet
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Force WAN failure</div>
          </div>
        </button>

        {/* Disable Weather */}
        <button
          onClick={() =>
            handleAction('kill_weather', 'Disabled Weather API', () =>
              onTriggerChaos('weather_api', 'DISABLE')
            )
          }
          className={`group flex flex-col justify-between p-3.5 rounded-lg border text-left transition-all duration-150 font-mono ${
            activeAction === 'kill_weather'
              ? 'bg-amber-900/90 border-amber-400 text-white scale-95 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-amber-500/50 text-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
              <CloudOff className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">API-503</span>
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-200 group-hover:text-amber-300">
              Disable Weather
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Trigger cache fallback</div>
          </div>
        </button>

        {/* Disable Calendar */}
        <button
          onClick={() =>
            handleAction('kill_cal', 'Disabled Calendar API', () =>
              onTriggerChaos('calendar_api', 'DISABLE')
            )
          }
          className={`group flex flex-col justify-between p-3.5 rounded-lg border text-left transition-all duration-150 font-mono ${
            activeAction === 'kill_cal'
              ? 'bg-amber-900/90 border-amber-400 text-white scale-95 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-amber-500/50 text-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
              <CalendarX className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">SYNC-OFF</span>
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-200 group-hover:text-amber-300">
              Disable Calendar
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Use local ICS store</div>
          </div>
        </button>

        {/* Corrupt Local File */}
        <button
          onClick={() =>
            handleAction('corrupt_fs', 'Corrupted Local File', () =>
              onTriggerChaos('local_filesystem', 'CORRUPT')
            )
          }
          className={`group flex flex-col justify-between p-3.5 rounded-lg border text-left transition-all duration-150 font-mono ${
            activeAction === 'corrupt_fs'
              ? 'bg-orange-900/90 border-orange-400 text-white scale-95 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
              : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-orange-500/50 text-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded bg-orange-950/80 border border-orange-500/30 text-orange-400 group-hover:scale-110 transition-transform">
              <FileWarning className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">IO-ERR</span>
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-200 group-hover:text-orange-300">
              Corrupt Local File
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Test state recovery</div>
          </div>
        </button>

        {/* Clear Cache */}
        <button
          onClick={() =>
            handleAction('clear_cache', 'Cleared Local Cache', () =>
              onTriggerChaos('local_cache', 'CLEAR')
            )
          }
          className={`group flex flex-col justify-between p-3.5 rounded-lg border text-left transition-all duration-150 font-mono ${
            activeAction === 'clear_cache'
              ? 'bg-purple-900/90 border-purple-400 text-white scale-95 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              : 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800 hover:border-purple-500/50 text-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform">
              <Trash2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">CACHE-0</span>
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-200 group-hover:text-purple-300">
              Clear Cache
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Force hard fallback</div>
          </div>
        </button>

        {/* Kill Agent Process */}
        <button
          onClick={() =>
            handleAction('crash_agent', 'Triggered Process SIGKILL', onRestartAgent)
          }
          className={`group flex flex-col justify-between p-3.5 rounded-lg border text-left transition-all duration-150 font-mono ${
            activeAction === 'crash_agent'
              ? 'bg-red-950 border-red-500 text-white scale-95 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
              : 'bg-zinc-900/90 hover:bg-red-950/40 border-red-500/40 hover:border-red-500 text-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded bg-red-950 border border-red-500/60 text-red-400 group-hover:scale-110 transition-transform">
              <ZapOff className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-red-400 font-mono font-bold">SIGKILL</span>
          </div>
          <div>
            <div className="text-xs font-bold text-red-400 group-hover:text-red-300">
              Kill Process (Crash)
            </div>
            <div className="text-[10px] text-red-500/80 mt-0.5">Test WAL resume</div>
          </div>
        </button>
      </div>

      {/* Real-time fault injection activity log */}
      {recentActions.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-zinc-500">Last Injected Fault:</span>
            <span className="text-amber-300 font-semibold">{recentActions[0].label}</span>
          </div>
          <span className="text-[10px] text-zinc-500">
            {new Date(recentActions[0].time).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};
