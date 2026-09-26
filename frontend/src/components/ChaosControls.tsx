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
      ...prev.slice(0, 2),
    ]);

    try {
      await fn();
    } finally {
      setTimeout(() => {
        setActiveAction((curr) => (curr === id ? null : curr));
      }, 500);
    }
  };

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-mono">
                Chaos Switchboard
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Fault Injection
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Inject deterministic failures to evaluate autonomous replanning
            </p>
          </div>
        </div>

        <button
          onClick={() => handleAction('restore', 'Restored Subsystems', onRestore)}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-mono text-[11px] font-bold uppercase transition-all duration-150 border ${
            activeAction === 'restore'
              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 scale-95 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
          }`}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${activeAction === 'restore' ? 'animate-spin' : ''}`} />
          <span>Restore All</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Kill Internet */}
        <button
          onClick={() =>
            handleAction('kill_net', 'Killed Internet', () =>
              onTriggerChaos('internet', 'DISABLE')
            )
          }
          className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all duration-150 ${
            activeAction === 'kill_net'
              ? 'bg-rose-500/20 border-rose-500 text-white scale-95'
              : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-rose-500/40 text-zinc-200'
          }`}
        >
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex-shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold font-sans truncate">Kill Internet</div>
            <div className="text-[10px] text-zinc-500 font-mono">WAN-CUT</div>
          </div>
        </button>

        {/* Disable Weather */}
        <button
          onClick={() =>
            handleAction('kill_weather', 'Disabled Weather API', () =>
              onTriggerChaos('weather_api', 'DISABLE')
            )
          }
          className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all duration-150 ${
            activeAction === 'kill_weather'
              ? 'bg-amber-500/20 border-amber-500 text-white scale-95'
              : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-amber-500/40 text-zinc-200'
          }`}
        >
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
            <CloudOff className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold font-sans truncate">Disable Weather</div>
            <div className="text-[10px] text-zinc-500 font-mono">API-503</div>
          </div>
        </button>

        {/* Disable Calendar */}
        <button
          onClick={() =>
            handleAction('kill_cal', 'Disabled Calendar API', () =>
              onTriggerChaos('calendar_api', 'DISABLE')
            )
          }
          className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all duration-150 ${
            activeAction === 'kill_cal'
              ? 'bg-amber-500/20 border-amber-500 text-white scale-95'
              : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-amber-500/40 text-zinc-200'
          }`}
        >
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex-shrink-0">
            <CalendarX className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold font-sans truncate">Disable Calendar</div>
            <div className="text-[10px] text-zinc-500 font-mono">SYNC-OFF</div>
          </div>
        </button>

        {/* Corrupt Local File */}
        <button
          onClick={() =>
            handleAction('corrupt_fs', 'Corrupted File', () =>
              onTriggerChaos('local_filesystem', 'CORRUPT')
            )
          }
          className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all duration-150 ${
            activeAction === 'corrupt_fs'
              ? 'bg-orange-500/20 border-orange-500 text-white scale-95'
              : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-orange-500/40 text-zinc-200'
          }`}
        >
          <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex-shrink-0">
            <FileWarning className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold font-sans truncate">Corrupt File</div>
            <div className="text-[10px] text-zinc-500 font-mono">IO-ERR</div>
          </div>
        </button>

        {/* Clear Cache */}
        <button
          onClick={() =>
            handleAction('clear_cache', 'Cleared Cache', () =>
              onTriggerChaos('local_cache', 'CLEAR')
            )
          }
          className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all duration-150 ${
            activeAction === 'clear_cache'
              ? 'bg-purple-500/20 border-purple-500 text-white scale-95'
              : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-purple-500/40 text-zinc-200'
          }`}
        >
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold font-sans truncate">Clear Cache</div>
            <div className="text-[10px] text-zinc-500 font-mono">CACHE-0</div>
          </div>
        </button>

        {/* Kill Process */}
        <button
          onClick={() =>
            handleAction('crash_agent', 'Triggered Crash', onRestartAgent)
          }
          className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all duration-150 ${
            activeAction === 'crash_agent'
              ? 'bg-rose-500/30 border-rose-500 text-white scale-95'
              : 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-500/30 hover:border-rose-500/60 text-rose-200'
          }`}
        >
          <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex-shrink-0">
            <ZapOff className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold font-sans truncate text-rose-300">Kill Process</div>
            <div className="text-[10px] text-rose-400/80 font-mono">SIGKILL</div>
          </div>
        </button>
      </div>

      {recentActions.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <div className="flex items-center space-x-2 truncate">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-zinc-500">Last Fault:</span>
            <span className="text-amber-300 font-semibold truncate">{recentActions[0].label}</span>
          </div>
          <span className="text-[10px] text-zinc-500 flex-shrink-0">
            {new Date(recentActions[0].time).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};
