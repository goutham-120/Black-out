/**
 * @file RecoveryVisualizer.tsx
 * @description Visualizes the autonomous fault recovery ladder and Gemma 4 strategy synthesis.
 * Corresponds to the RECOVER stage of the BLACKOUT execution loop.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  AlertOctagon,
  ChevronRight,
  RotateCw,
} from 'lucide-react';
import { RecoveryEvent, RecoveryOption } from '../types/agent';

interface RecoveryVisualizerProps {
  recoveries: RecoveryEvent[];
}

export const RecoveryVisualizer: React.FC<RecoveryVisualizerProps> = ({ recoveries }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  if (!recoveries || recoveries.length === 0) {
    return (
      <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
        <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-zinc-800/80">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-mono">
              Recovery Strategy Ladder
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">Autonomous self-healing &amp; replan diagnostics</p>
          </div>
        </div>

        <div className="py-8 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-xl">
          No recovery events triggered. System executing under nominal parameters.
        </div>
      </div>
    );
  }

  const activeEvent = recoveries[selectedIdx] || recoveries[0];

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-mono">
                Recovery Strategy Ladder
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Gemma 4 Arbitrated
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Autonomous multi-tier mitigation upon tool interruption
            </p>
          </div>
        </div>

        {recoveries.length > 1 && (
          <div className="flex items-center space-x-1.5 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 font-mono text-[10px]">
            {recoveries.map((rec, i) => (
              <button
                key={rec.recovery_id || i}
                onClick={() => setSelectedIdx(i)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  selectedIdx === i
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                #{i + 1} {rec.failed_tool}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline Flow */}
      <div className="p-3.5 mb-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
        <div className="text-[9px] uppercase text-zinc-500 font-mono font-bold mb-2 tracking-wider">
          Arbitration Pipeline Flow
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <div>
              <div className="text-[8px] uppercase font-mono text-rose-400 font-bold">Failed Tool</div>
              <div className="font-semibold text-xs text-rose-200 font-sans">{activeEvent.failed_tool}</div>
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />

          <div className="flex items-center space-x-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 min-w-0">
            <RotateCw className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[8px] uppercase font-mono text-amber-400 font-bold">Intercepted Fault</div>
              <div className="font-semibold text-xs text-amber-200 truncate max-w-[160px] font-mono">
                {activeEvent.error_code}
              </div>
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />

          <div className="flex items-center space-x-2 p-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <div>
              <div className="text-[8px] uppercase font-mono text-purple-400 font-bold">Selected Strategy</div>
              <div className="font-bold text-xs text-white font-sans">{activeEvent.selected_strategy}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluated Options */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
            Evaluated Strategies ({activeEvent.options_evaluated.length})
          </span>
          <span className="text-[10px] text-zinc-500">
            {new Date(activeEvent.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {activeEvent.options_evaluated.map((option: RecoveryOption, idx: number) => {
          const isAccepted = option.verdict === 'ACCEPTED';
          const isRejected = option.verdict === 'REJECTED';
          const isDeferred = option.verdict === 'DEFERRED';

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all ${
                isAccepted
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : isRejected
                  ? 'bg-zinc-900/40 border-zinc-800/60 opacity-80'
                  : 'bg-zinc-900/30 border-zinc-800/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center space-x-2">
                  {isAccepted && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                  {isDeferred && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                  <span
                    className={`text-xs font-semibold font-sans ${
                      isAccepted ? 'text-emerald-300 font-bold' : 'text-zinc-300'
                    }`}
                  >
                    {option.strategy}
                  </span>
                </div>

                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                    isAccepted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : isRejected
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {option.verdict}
                </span>
              </div>

              <div className="flex items-start space-x-1.5 text-[11px] text-zinc-400 pl-5 font-sans">
                <ChevronRight className="w-3 h-3 text-zinc-600 flex-shrink-0 mt-0.5" />
                <p className="leading-snug">{option.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
