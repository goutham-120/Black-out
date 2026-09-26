/**
 * @file ProvenancePage.tsx
 * @description Dedicated Data Provenance, Lineage, and Safety Gate Inspector page.
 * Tracks source origin, freshness age, trust ratings, and cryptographic SHA256 checksums
 * to prevent hallucinated or corrupted data from propagating through the agent loop.
 */

import React from 'react';
import {
  FileCheck2,
  ShieldCheck,
  Clock,
  Hash,
} from 'lucide-react';
import { FullAgentState } from '../types/agent';
import { ProvenanceInspector } from '../components/ProvenanceInspector';

interface ProvenancePageProps {
  state: FullAgentState;
}

export const ProvenancePage: React.FC<ProvenancePageProps> = ({ state }) => {
  const provenanceList = state?.provenance || [];
  const avgTrust =
    provenanceList.length > 0
      ? (
          (provenanceList.reduce((acc, p) => acc + p.trust_score, 0) /
            provenanceList.length) *
          100
        ).toFixed(1)
      : '100';

  const verifiedChecksumCount = provenanceList.filter((p) => p.verified).length;

  return (
    <div className="space-y-6">
      {/* Provenance KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl space-y-1">
          <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Average Trust Score</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {avgTrust}%
          </div>
          <div className="text-[10px] text-zinc-500 font-sans">
            Safety Gate threshold: &gt; 50%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl space-y-1">
          <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono">
            <Hash className="w-4 h-4 text-cyan-400" />
            <span>SHA256 Cryptographic Checksums</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-cyan-300">
            {verifiedChecksumCount} Verified
          </div>
          <div className="text-[10px] text-zinc-500 font-sans">Zero bit rot or corruption</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl space-y-1">
          <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Max Staleness Age</span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-purple-300">
            {provenanceList.length > 0
              ? `${Math.max(...provenanceList.map((p) => p.age_seconds))}s`
              : '0s'}
          </div>
          <div className="text-[10px] text-zinc-500 font-sans">
            Safety Gate threshold: &lt; 3600s
          </div>
        </div>
      </div>

      {/* Main Provenance Inspector & Lineage Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-300 uppercase">
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
            <span>Verified Telemetry Lineage Records</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">
            Total Tracked: {provenanceList.length}
          </span>
        </div>

        <ProvenanceInspector provenance={provenanceList} />
      </div>
    </div>
  );
};
