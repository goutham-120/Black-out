/**
 * @file RecoveryVisualizer.tsx
 * @description Visualizes the autonomous fault recovery ladder and Gemma 4 strategy synthesis.
 * Corresponds to the RECOVER stage of the BLACKOUT execution loop, showing evaluated alternatives,
 * rejection rationales, and selected dynamic fallback strategies.
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
      <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-zinc-800/80">
          <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
              Recovery Strategy Ladder
            </h3>
            <p className="text-xs text-zinc-400">Autonomous self-healing &amp; replan diagnostics</p>
          </div>
        </div>

        <div className="py-10 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-lg">
          No recovery events triggered. System executing under normal nominal parameters.
        </div>
      </div>
    );
  }

  const activeEvent = recoveries[selectedIdx] || recoveries[0];

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
                Recovery Strategy Ladder
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
                Gemma 4 Arbitrated
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Evaluates multi-tier mitigation options upon deterministic tool interruption
            </p>
          </div>
        </div>

        {/* Multi-event tab selector if multiple recoveries recorded */}
        {recoveries.length > 1 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto bg-zinc-900 p-1 rounded-lg border border-zinc-800 font-mono text-xs">
            {recoveries.map((rec, i) => (
              <button
                key={rec.recovery_id || i}
                onClick={() => setSelectedIdx(i)}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  selectedIdx === i
                    ? 'bg-purple-600 text-white font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                #{i + 1} {rec.failed_tool}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Decision Flow Pipeline Diagram */}
      <div className="p-4 mb-5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 font-mono">
        <div className="text-[10px] uppercase text-zinc-500 font-bold mb-2 tracking-wider">
          Arbitration Pipeline Flow
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs">
          {/* Failed Tool */}
          <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300">
            <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-rose-400 font-bold">Failed Tool</div>
              <div className="font-semibold text-rose-200">{activeEvent.failed_tool}</div>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />

          {/* Error Code */}
          <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300">
            <RotateCw className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">Intercepted Error</div>
              <div className="font-semibold text-amber-200 truncate max-w-[200px]">{activeEvent.error_code}</div>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />

          {/* Selected Strategy Decision */}
          <div className="flex items-center space-x-2 p-2.5 rounded-lg bg-purple-950/90 border border-purple-500/60 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div>
              <div className="text-[9px] uppercase tracking-wider text-purple-400 font-bold">Selected Strategy</div>
              <div className="font-bold text-white">{activeEvent.selected_strategy}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluated Options Decision Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <span className="text-zinc-400 uppercase tracking-wider font-bold">
            Evaluated Strategy Alternatives ({activeEvent.options_evaluated.length})
          </span>
          <span className="text-[11px] text-zinc-500">
            {new Date(activeEvent.timestamp).toLocaleTimeString()}
          </span>
        </div>

        <div className="space-y-2.5">
          {activeEvent.options_evaluated.map((option: RecoveryOption, idx: number) => {
            const isAccepted = option.verdict === 'ACCEPTED';
            const isRejected = option.verdict === 'REJECTED';
            const isDeferred = option.verdict === 'DEFERRED';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-lg border font-mono transition-all ${
                  isAccepted
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : isRejected
                    ? 'bg-zinc-900/60 border-zinc-800/80 opacity-80'
                    : 'bg-zinc-900/40 border-zinc-800/60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    {isAccepted && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    {isRejected && <XCircle className="w-4 h-4 text-rose-500" />}
                    {isDeferred && <Clock className="w-4 h-4 text-amber-400" />}
                    <span
                      className={`text-xs font-bold ${
                        isAccepted ? 'text-emerald-300' : 'text-zinc-300'
                      }`}
                    >
                      {option.strategy}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      isAccepted
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : isRejected
                        ? 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                        : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {option.verdict}
                  </span>
                </div>

                <div className="flex items-start space-x-2 text-[11px] text-zinc-400 pl-6">
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{option.reason}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
