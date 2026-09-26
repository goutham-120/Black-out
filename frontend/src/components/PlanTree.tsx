/**
 * @file PlanTree.tsx
 * @description Renders the real-time execution plan and dynamic replanning tree for BLACKOUT.
 * Visualizes the DECIDE, ACT, and REPLAN phases.
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
  plan?: Step[];
  currentStepId?: string | null;
}

export const PlanTree: React.FC<PlanTreeProps> = ({ plan = [], currentStepId = null }) => {
  const safePlan = Array.isArray(plan) ? plan : [];

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-mono">
              Dynamic Plan Tree
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">
              Deterministic workflow with Gemma 4 dynamic fallback branches
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-[10px] text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
          <span className="text-emerald-400 font-bold">
            {safePlan.filter((s) => s.status === 'COMPLETED').length}
          </span>
          <span>/</span>
          <span>{safePlan.length} STEPS</span>
        </div>
      </div>

      {safePlan.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-xl">
          No active mission plan. Dispatch a mission to generate execution graph.
        </div>
      ) : (
        <div className="relative pl-3 space-y-3">
          {safePlan.map((step, index) => {
            const isActive = step.step_id === currentStepId || step.status === 'IN_PROGRESS';
            const isCompleted = step.status === 'COMPLETED';
            const isFailed = step.status === 'FAILED';
            const isPending = step.status === 'PENDING';

            return (
              <div
                key={step.step_id || index}
                className={`relative flex items-start space-x-3.5 p-3.5 rounded-xl transition-all duration-150 border ${
                  isActive
                    ? 'bg-cyan-950/20 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                    : isFailed
                    ? 'bg-rose-950/10 border-rose-500/30'
                    : isCompleted
                    ? 'bg-zinc-900/50 border-zinc-800/80'
                    : 'bg-zinc-900/20 border-zinc-800/40 text-zinc-500'
                }`}
              >
                {/* Node Status Indicator */}
                <div className="flex-shrink-0 mt-0.5">
                  {isActive && (
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                  )}
                  {isCompleted && (
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {isFailed && (
                    <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400">
                      <XCircle className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {isPending && (
                    <div className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-mono text-[10px]">
                      <Clock className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-[10px] font-mono text-zinc-500 font-bold flex-shrink-0">
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                      <h4
                        className={`text-xs font-semibold font-sans truncate ${
                          isFailed
                            ? 'line-through text-rose-400/80'
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

                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      {step.is_fallback && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                          <span>DYNAMIC FALLBACK</span>
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase border ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isFailed
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-zinc-800/60 text-zinc-500 border-zinc-700/60'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-400 mt-1">
                    <div className="flex items-center space-x-1 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800/80">
                      <Wrench className="w-3 h-3 text-zinc-500" />
                      <span className="text-zinc-500">tool:</span>
                      <span className="text-zinc-300 font-semibold">{step.tool}</span>
                    </div>

                    {step.provenance_ref && (
                      <div className="flex items-center space-x-1 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800/80 truncate">
                        <LinkIcon className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        <span className="text-zinc-500">provenance:</span>
                        <span className="text-cyan-300 font-semibold truncate">{step.provenance_ref}</span>
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
