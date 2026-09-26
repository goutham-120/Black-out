/**
 * @file HumanHandoffModal.tsx
 * @description Safety Gate interruption modal for BLACKOUT.
 * Activates when environmental uncertainty, stale data thresholds, or tool exhaustion
 * requires human verification before critical irreversible actions are executed.
 */

import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
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
      return 'bg-rose-950/80 hover:bg-rose-900 border-rose-500/60 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.3)]';
    }
    if (upper.includes('STALE') || upper.includes('OVERRIDE') || upper.includes('FORCE')) {
      return 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/60 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
    }
    return 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/60 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-zinc-950 border-2 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.35)]">
        {/* Top Warning Banner */}
        <div className="flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-amber-950 via-amber-900/80 to-zinc-950 border-b border-amber-500/50">
          <div className="p-2 rounded-lg bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse">
            <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] tracking-widest text-amber-400 font-bold uppercase block">
              Safety Gate Intercept
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              HUMAN ACTION REQUIRED — AUTONOMOUS BOUNDARY REACHED
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-zinc-300 max-h-[75vh] overflow-y-auto">
          {/* Reason Box */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Trigger Reason
            </span>
            <p className="text-sm font-semibold text-zinc-100">{handoff.reason}</p>
          </div>

          {/* Detailed Summary */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Mission Context Summary
            </span>
            <p className="text-zinc-300 leading-relaxed bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
              {handoff.summary}
            </p>
          </div>

          {/* Side-by-side Known vs Unknown Facts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* What BLACKOUT Knows */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-emerald-500/30">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px] mb-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>What BLACKOUT Knows</span>
              </div>
              <ul className="space-y-2 text-[11px]">
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

            {/* What BLACKOUT Does Not Know */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-rose-500/30">
              <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider text-[11px] mb-3">
                <XCircle className="w-4 h-4" />
                <span>What BLACKOUT Does Not Know</span>
              </div>
              <ul className="space-y-2 text-[11px]">
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
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              Required Human Decision
            </span>
            <p className="text-xs text-zinc-200 font-medium">
              {handoff.required_human_action || 'Select one of the validated mitigation options below to resume execution.'}
            </p>
          </div>
        </div>

        {/* Action Decision Footer */}
        <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 bg-zinc-900/90 border-t border-zinc-800">
          {handoff.options && handoff.options.length > 0 ? (
            handoff.options.map((opt) => (
              <button
                key={opt}
                onClick={() => onResolve(opt)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg border font-mono text-xs font-bold uppercase transition-all duration-150 hover:scale-[1.02] active:scale-95 ${getOptionStyle(
                  opt
                )}`}
              >
                <span>{formatOptionLabel(opt)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ))
          ) : (
            <button
              onClick={() => onResolve('ACKNOWLEDGE_AND_PROCEED')}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Acknowledge &amp; Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
