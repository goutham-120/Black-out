/**
 * @file HumanHandoffModal.tsx
 * @description Safety Gate interruption modal for BLACKOUT.
 * Activates when environmental uncertainty, stale data thresholds, or tool exhaustion
 * requires human verification before critical irreversible actions are executed.
 */

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { HumanHandoff } from '../types/agent';

interface HumanHandoffModalProps {
  handoff: HumanHandoff | null;
  onResolve: (decision: string) => void;
}

export const HumanHandoffModal: React.FC<HumanHandoffModalProps> = ({ handoff, onResolve }) => {
  if (!handoff) return null;

  const formatOptionLabel = (opt: string): string => {
    return opt
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getOptionStyle = (opt: string): string => {
    const upper = opt.toUpperCase();
    if (upper.includes('ABORT') || upper.includes('CANCEL') || upper.includes('HALT')) {
      return 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300';
    }
    if (upper.includes('STALE') || upper.includes('OVERRIDE') || upper.includes('FORCE')) {
      return 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300';
    }
    return 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-zinc-950 border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)]">
        {/* Top Warning Banner */}
        <div className="flex items-center space-x-3 px-6 py-4 bg-amber-950/20 border-b border-amber-500/30">
          <div className="p-2 rounded-xl bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] tracking-widest text-amber-400 font-mono font-bold uppercase block">
              Safety Gate Intercept
            </span>
            <h2 className="text-sm font-bold text-white tracking-wide">
              HUMAN ACTION REQUIRED — AUTONOMOUS BOUNDARY REACHED
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-zinc-300 max-h-[75vh] overflow-y-auto">
          {/* Reason Box */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-wider">
              Trigger Reason
            </span>
            <p className="text-xs font-semibold text-zinc-100">{handoff.reason}</p>
          </div>

          {/* Detailed Summary */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 tracking-wider">
              Mission Context Summary
            </span>
            <p className="text-zinc-300 leading-relaxed bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
              {handoff.summary}
            </p>
          </div>

          {/* Side-by-side Known vs Unknown Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-emerald-500/20">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider text-[10px] font-mono mb-2.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>What BLACKOUT Knows</span>
              </div>
              <ul className="space-y-1.5 text-[11px]">
                {handoff.known_facts && handoff.known_facts.length > 0 ? (
                  handoff.known_facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-zinc-300">
                      <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                      <span>{fact}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-500 italic">No verified facts recorded.</li>
                )}
              </ul>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-rose-500/20">
              <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider text-[10px] font-mono mb-2.5">
                <XCircle className="w-3.5 h-3.5" />
                <span>What BLACKOUT Does Not Know</span>
              </div>
              <ul className="space-y-1.5 text-[11px]">
                {handoff.unknown_facts && handoff.unknown_facts.length > 0 ? (
                  handoff.unknown_facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-zinc-300">
                      <span className="text-rose-400 font-bold mt-0.5">⚠</span>
                      <span>{fact}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-500 italic">No missing facts flagged.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Required Action Instruction */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 tracking-wider">
              Required Operator Verdict
            </span>
            <p className="text-xs text-zinc-200">
              {handoff.required_human_action || 'Select one of the validated mitigation options below to resume execution.'}
            </p>
          </div>
        </div>

        {/* Action Decision Footer */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 px-6 py-4 bg-zinc-900/80 border-t border-zinc-800">
          {handoff.options && handoff.options.length > 0 ? (
            handoff.options.map((opt) => (
              <button
                key={opt}
                onClick={() => onResolve(opt)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-mono text-xs font-bold uppercase transition-all duration-150 hover:scale-[1.02] active:scale-95 ${getOptionStyle(
                  opt
                )}`}
              >
                <span>{formatOptionLabel(opt)}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ))
          ) : (
            <button
              onClick={() => onResolve('ACKNOWLEDGE_AND_PROCEED')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono"
            >
              Acknowledge &amp; Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
