/**
 * @file PlanTree.tsx
 * @description Renders the real-time execution plan and dynamic replanning tree for BLACKOUT.
 * Visualizes the DECIDE, ACT, and REPLAN phases, differentiating initial deterministic steps
 * from Gemma 4 generated dynamic fallbacks, active executions, and failed branches.
 */

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Sparkles,
  Wrench,
  Link as LinkIcon,
  GitCommit,
} from 'lucide-react';
import { Step } from '../types/agent';

interface PlanTreeProps {
  plan: Step[];
  currentStepId: string | null;
}

export const PlanTree: React.FC<PlanTreeProps> = ({ plan, currentStepId }) => {
  return (
    <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)]">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
              Dynamic Plan Tree &amp; Execution Graph
            </h3>
            <p className="text-xs text-zinc-400">
              Live deterministic execution with dynamic fallback replanning branches
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-zinc-400">
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
            {plan.filter((s) => s.status === 'COMPLETED').length} / {plan.length} STEPS
          </span>
        </div>
      </div>

      {plan.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-lg">
          No mission plan active. Initiate a mission to generate execution graph.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4">
          {/* Continuous vertical timeline connector */}
          <div className="absolute left-[35px] top-4 bottom-4 w-0.5 bg-zinc-800/80 -z-0" />

          {plan.map((step, index) => {
            const isActive = step.step_id === currentStepId || step.status === 'IN_PROGRESS';
            const isCompleted = step.status === 'COMPLETED';
            const isFailed = step.status === 'FAILED';
            const isPending = step.status === 'PENDING';

            return (
              <div
                key={step.step_id || index}
                className={`relative z-10 flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 border ${
                  isActive
                    ? 'bg-zinc-900/95 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50 animate-pulse-slow'
                    : isFailed
                    ? 'bg-zinc-950/90 border-rose-900/60 opacity-90'
                    : isCompleted
                    ? 'bg-zinc-900/60 border-zinc-800/80'
                    : 'bg-zinc-950/50 border-zinc-900 text-zinc-500'
                }`}
              >
                {/* Node Status Icon / Stepper Indicator */}
                <div className="flex-shrink-0 mt-0.5">
                  {isActive && (
                    <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                    </div>
                  )}
                  {isCompleted && (
                    <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-500/80 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  {isFailed && (
                    <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-500/80 flex items-center justify-center text-rose-400">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                  {isPending && (
                    <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-500 font-mono text-xs">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Step Details & Metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono text-zinc-500 font-bold">
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                      <h4
                        className={`text-xs font-mono font-semibold ${
                          isFailed
                            ? 'line-through text-rose-400/90'
                            : isActive
                            ? 'text-cyan-200 font-bold'
                            : isCompleted
                            ? 'text-zinc-200'
                            : 'text-zinc-400'
                        }`}
                      >
                        {step.title}
                      </h4>
                    </div>

                    {/* Step Badges */}
                    <div className="flex items-center space-x-2">
                      {step.is_fallback && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-950/90 text-purple-300 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>DYNAMIC FALLBACK</span>
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          isActive
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                            : isCompleted
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                            : isFailed
                            ? 'bg-rose-950 text-rose-400 border-rose-500/50'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                  </div>

                  {/* Footer metadata: Tool name and Provenance key */}
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] font-mono text-zinc-400">
                    <div className="flex items-center space-x-1.5 text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                      <Wrench className="w-3 h-3 text-zinc-500" />
                      <span>tool:</span>
                      <span className="text-zinc-300 font-semibold">{step.tool}</span>
                    </div>

                    {step.provenance_ref && (
                      <div className="flex items-center space-x-1.5 text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                        <LinkIcon className="w-3 h-3 text-cyan-400" />
                        <span>provenance:</span>
                        <span className="text-cyan-300 font-semibold">{step.provenance_ref}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
