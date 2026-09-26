/**
 * @file PlanPage.tsx
 * @description Dedicated Execution Plan & Autonomous Loop management page.
 * Displays the complete dynamic step tree, tool parameters, atomic SQLite WAL sync queue,
 * and loop stage progression.
 */

import React from 'react';
import {
  GitFork,
  Layers,
  Database,
  CheckCircle2,
  Clock,
  AlertOctagon,
} from 'lucide-react';
import { FullAgentState } from '../types/agent';
import { PlanTree } from '../components/PlanTree';
import { GeneratedArtifact } from '../components/ArtifactViewer';

interface PlanPageProps {
  state: FullAgentState;
  activeStepId: string | null;
  onViewArtifact?: (artifact: GeneratedArtifact) => void;
}

export const PlanPage: React.FC<PlanPageProps> = ({
  state,
  activeStepId,
  onViewArtifact,
}) => {
  const completedCount = (state?.plan || []).filter((s) => s.status === 'COMPLETED').length;
  const inProgressCount = (state?.plan || []).filter((s) => s.status === 'IN_PROGRESS').length;
  const failedCount = (state?.plan || []).filter((s) => s.status === 'FAILED').length;
  const pendingCount = (state?.plan || []).filter((s) => s.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Plan Progress Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl space-y-1">
          <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed Steps</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {completedCount}
          </div>
          <div className="text-[10px] text-zinc-500 font-sans">Verified on SQLite WAL</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl space-y-1">
          <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>In Execution</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-cyan-300">
            {inProgressCount}
          </div>
          <div className="text-[10px] text-zinc-500 font-sans">Current loop target</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl space-y-1">
          <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>Intercepted Faults</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-400">
            {failedCount}
          </div>
          <div className="text-[10px] text-zinc-500 font-sans">Recovered via ladder</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl space-y-1">
          <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Pending Steps</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-zinc-300">
            {pendingCount}
          </div>
          <div className="text-[10px] text-zinc-500 font-sans">Remaining sequence</div>
        </div>
      </div>

      {/* Main Execution Tree & SQLite WAL Sync Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Full Plan Tree (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-300 uppercase">
              <GitFork className="w-4 h-4 text-cyan-400" />
              <span>Dynamic Plan Tree & Replan Mutations</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">
              Active: {activeStepId || 'None'}
            </span>
          </div>
          <PlanTree
            plan={state?.plan || []}
            currentStepId={activeStepId}
            onViewArtifact={onViewArtifact}
          />
        </div>

        {/* SQLite WAL Atomic Pre-Execution Journal (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-300 uppercase">
              <Database className="w-4 h-4 text-amber-400" />
              <span>SQLite WAL Pre-Execution Queue</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {(state?.pending_actions || []).length} QUEUED
            </span>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4">
            <div className="space-y-1 border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-mono font-bold text-zinc-200 uppercase">
                Crash-Resilience Checkpoints
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                Every pending step and plan mutation is journaled to WAL SQLite before tool invocation.
                If SIGKILL interrupts the process, the agent resumes from the exact recorded checkpoint.
              </p>
            </div>

            {(state?.pending_actions || []).length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs font-mono border border-dashed border-zinc-800 rounded-xl space-y-1">
                <div>No pending actions awaiting disk commit.</div>
                <div className="text-[10px] text-zinc-600">All journal entries committed to SQLite WAL.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {(state?.pending_actions || []).map((act) => (
                  <div
                    key={act.action_id}
                    className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-[11px] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 font-mono text-xs">
                        {act.type}
                      </span>
                      <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono">
                        {act.status}
                      </span>
                    </div>
                    <div className="bg-zinc-950 p-2.5 rounded-lg text-[10px] text-zinc-400 font-mono overflow-x-auto">
                      <pre>{JSON.stringify(act.payload, null, 2)}</pre>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                      <span>ID: {act.action_id}</span>
                      <span>{new Date(act.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
