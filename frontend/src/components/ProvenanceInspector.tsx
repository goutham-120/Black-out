/**
 * @file ProvenanceInspector.tsx
 * @description Inspects and displays data lineage, freshness, and trust ratings.
 * Supports the CHECK and Safety Gate stages of BLACKOUT.
 */

import React from 'react';
import {
  FileCheck2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { ProvenanceItem } from '../types/agent';

interface ProvenanceInspectorProps {
  provenance: Record<string, ProvenanceItem> | ProvenanceItem[];
}

function formatAge(ageSeconds: number): string {
  if (ageSeconds < 60) return `${Math.floor(ageSeconds)}s ago`;
  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getTrustScoreStyles(score: number) {
  const percentage = Math.round(score * 100);
  if (percentage >= 80) {
    return {
      bar: 'bg-emerald-500',
      barBg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
    };
  }
  if (percentage >= 50) {
    return {
      bar: 'bg-amber-500',
      barBg: 'bg-amber-500/10',
      text: 'text-amber-400',
    };
  }
  return {
    bar: 'bg-rose-500',
    barBg: 'bg-rose-500/10',
    text: 'text-rose-400',
  };
}

function getStatusStyle(status: ProvenanceItem['status']) {
  switch (status) {
    case 'VERIFIED_LIVE':
      return {
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        icon: CheckCircle2,
      };
    case 'STALE':
      return {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        icon: AlertTriangle,
      };
    case 'UNVERIFIED':
    default:
      return {
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        icon: HelpCircle,
      };
  }
}

export const ProvenanceInspector: React.FC<ProvenanceInspectorProps> = ({ provenance }) => {
  const items: ProvenanceItem[] = Array.isArray(provenance)
    ? provenance
    : Object.values(provenance || {});

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-mono">
              Data Lineage &amp; Provenance
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">
              Cryptographic verification &amp; trust thresholds
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 font-mono text-[10px] text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>{items.length} SOURCES</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-xl">
          No data provenance records logged for active mission.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => {
            const trustStyles = getTrustScoreStyles(item.trust_score);
            const statusStyles = getStatusStyle(item.status);
            const StatusIcon = statusStyles.icon;
            const trustPct = Math.round(item.trust_score * 100);

            return (
              <div
                key={item.data_key}
                className="flex flex-col justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Database className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span className="text-xs font-mono font-bold text-zinc-200 truncate">
                        {item.data_key}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase border flex-shrink-0 ${statusStyles.badge}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{item.status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/60 mb-3">
                    <span className="text-zinc-500 block text-[9px] uppercase font-mono tracking-wider mb-0.5">
                      Source URI
                    </span>
                    <span className="text-zinc-300 font-mono text-[11px] break-all leading-tight">
                      {item.source}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="mb-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-zinc-500">Trust Rating</span>
                      <span className={`font-bold ${trustStyles.text}`}>
                        {trustPct}%
                      </span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${trustStyles.barBg}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${trustStyles.bar}`}
                        style={{ width: `${Math.min(100, Math.max(0, trustPct))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span>{formatAge(item.age_seconds)}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.verified ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <span className={item.verified ? 'text-emerald-400' : 'text-rose-400'}>
                        {item.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
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
