/**
 * @file ProvenanceInspector.tsx
 * @description Inspects and displays data lineage, freshness, and trust ratings.
 * Supports the CHECK and Safety Gate stages of BLACKOUT, ensuring Gemma 4 does not hallucinate
 * from corrupted or overly stale environmental snapshots without explicit provenance verification.
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
  if (ageSeconds < 60) {
    return `${Math.floor(ageSeconds)}s ago`;
  }
  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getTrustScoreStyles(score: number): {
  color: string;
  barBg: string;
  textClass: string;
} {
  const percentage = Math.round(score * 100);
  if (percentage >= 80) {
    return {
      color: 'bg-emerald-500',
      barBg: 'bg-emerald-950/60',
      textClass: 'text-emerald-400',
    };
  }
  if (percentage >= 50) {
    return {
      color: 'bg-amber-500',
      barBg: 'bg-amber-950/60',
      textClass: 'text-amber-400',
    };
  }
  return {
    color: 'bg-rose-500',
    barBg: 'bg-rose-950/60',
    textClass: 'text-rose-400',
  };
}

function getStatusStyle(status: ProvenanceItem['status']): {
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
} {
  switch (status) {
    case 'VERIFIED_LIVE':
      return {
        badge: 'bg-emerald-950 text-emerald-300 border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
        icon: CheckCircle2,
      };
    case 'STALE':
      return {
        badge: 'bg-orange-950 text-orange-300 border-orange-500/60 shadow-[0_0_8px_rgba(249,115,22,0.3)]',
        icon: AlertTriangle,
      };
    case 'UNVERIFIED':
    default:
      return {
        badge: 'bg-rose-950 text-rose-400 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
        icon: HelpCircle,
      };
  }
}

export const ProvenanceInspector: React.FC<ProvenanceInspectorProps> = ({ provenance }) => {
  const items: ProvenanceItem[] = Array.isArray(provenance)
    ? provenance
    : Object.values(provenance || {});

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.25)]">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
              Data Lineage &amp; Provenance Inspector
            </h3>
            <p className="text-xs text-zinc-400">
              Safety Gate trust rating, age verification, and tamper verification
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{items.length} TRACKED SOURCES</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-lg">
          No data provenance records logged for current mission.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {items.map((item) => {
            const trustStyles = getTrustScoreStyles(item.trust_score);
            const statusStyles = getStatusStyle(item.status);
            const StatusIcon = statusStyles.icon;
            const trustPct = Math.round(item.trust_score * 100);

            return (
              <div
                key={item.data_key}
                className="flex flex-col justify-between p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition-all font-mono"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span className="text-xs font-bold text-zinc-200 truncate max-w-[170px]" title={item.data_key}>
                        {item.data_key}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusStyles.badge}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{item.status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  {/* Source URI */}
                  <div className="text-[11px] text-zinc-400 bg-zinc-950/70 p-2 rounded border border-zinc-900 break-all mb-3">
                    <span className="text-zinc-600 block text-[9px] uppercase font-bold tracking-wider mb-0.5">
                      Source Lineage
                    </span>
                    <span className="text-zinc-300 font-mono">{item.source}</span>
                  </div>
                </div>

                <div>
                  {/* Trust Score Progress Bar */}
                  <div className="mb-2.5">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-zinc-500">Trust Score</span>
                      <span className={`font-bold ${trustStyles.textClass}`}>
                        {trustPct}%
                      </span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${trustStyles.barBg}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${trustStyles.color}`}
                        style={{ width: `${Math.min(100, Math.max(0, trustPct))}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer: Age and Verification badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500">
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
                        {item.verified ? 'Cryptographically Valid' : 'Unverified Payload'}
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
