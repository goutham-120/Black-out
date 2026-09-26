/**
 * @file CapabilityMatrix.tsx
 * @description Renders the real-time capability probe status matrix for BLACKOUT.
 * Visualizes live tool health, staleness, and latency in the SENSE phase.
 */

import React from 'react';
import {
  Cpu,
  HardDrive,
  Database,
  Wifi,
  Calendar,
  CloudSun,
  Layers,
  Activity,
} from 'lucide-react';
import { Capability, CapabilityStatus } from '../types/agent';

interface CapabilityMatrixProps {
  capabilities: Record<string, Capability>;
}

interface CapabilityMeta {
  key: string;
  aliases: string[];
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CAPABILITY_DEFINITIONS: CapabilityMeta[] = [
  {
    key: 'local_gemma_llm',
    aliases: ['gemma_4', 'gemma', 'llm', 'local_llm'],
    label: 'Gemma 4 (Local Q4)',
    category: 'Local Core',
    icon: Cpu,
  },
  {
    key: 'filesystem',
    aliases: ['local_fs', 'fs', 'local_filesystem'],
    label: 'Local File System',
    category: 'Storage',
    icon: HardDrive,
  },
  {
    key: 'local_cache',
    aliases: ['cache', 'storage_cache'],
    label: 'Local Cache Store',
    category: 'Storage',
    icon: Database,
  },
  {
    key: 'sqlite_wal',
    aliases: ['sync_queue', 'wal_db', 'sqlite', 'persistence'],
    label: 'SQLite WAL Database',
    category: 'Persistence',
    icon: Layers,
  },
  {
    key: 'internet',
    aliases: ['network', 'wan', 'gateway'],
    label: 'Internet Gateway',
    category: 'Network',
    icon: Wifi,
  },
  {
    key: 'calendar',
    aliases: ['calendar_api', 'gcal'],
    label: 'Calendar API',
    category: 'Network',
    icon: Calendar,
  },
  {
    key: 'weather_api',
    aliases: ['weather', 'noaa_api'],
    label: 'Weather Radar API',
    category: 'Network',
    icon: CloudSun,
  },
];

function getStatusBadge(status: CapabilityStatus) {
  switch (status) {
    case 'AVAILABLE':
      return {
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        card: 'border-zinc-800/80 hover:border-emerald-500/40 bg-zinc-900/60',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-400',
      };
    case 'DEGRADED':
      return {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        card: 'border-amber-500/30 hover:border-amber-500/50 bg-amber-950/10',
        iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        dot: 'bg-amber-400',
      };
    case 'STALE':
      return {
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        card: 'border-orange-500/30 hover:border-orange-500/50 bg-orange-950/10',
        iconBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        dot: 'bg-orange-400',
      };
    case 'UNAVAILABLE':
      return {
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse',
        card: 'border-rose-500/30 hover:border-rose-500/50 bg-rose-950/10',
        iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        dot: 'bg-rose-500',
      };
    default:
      return {
        badge: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        card: 'border-zinc-800 bg-zinc-900/40',
        iconBg: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        dot: 'bg-zinc-500',
      };
  }
}

export const CapabilityMatrix: React.FC<CapabilityMatrixProps> = ({ capabilities }) => {
  const resolveCapability = (def: CapabilityMeta): Capability => {
    if (capabilities[def.key]) return capabilities[def.key];
    for (const alias of def.aliases) {
      if (capabilities[alias]) return capabilities[alias];
    }
    return {
      status: 'UNKNOWN',
      latency_ms: 0,
      details: 'Probe inactive.',
    };
  };

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-mono">
              Live Capability Matrix
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans">
              Environmental health &amp; hardware fallback readiness
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>PROBE: 1000ms</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CAPABILITY_DEFINITIONS.map((def) => {
          const cap = resolveCapability(def);
          const style = getStatusBadge(cap.status);
          const Icon = def.icon;

          return (
            <div
              key={def.key}
              className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-150 ${style.card}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg border flex-shrink-0 ${style.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 truncate font-sans">
                        {def.label}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">
                        {def.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase border flex-shrink-0 ${style.badge}`}
                  >
                    <span className={`w-1 h-1 rounded-full ${style.dot}`} />
                    <span>{cap.status}</span>
                  </span>
                </div>

                <p className="text-[11px] leading-snug text-zinc-400 line-clamp-2 mt-1 font-sans">
                  {cap.details || 'Operational parameters nominal.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-800/60 text-[10px] font-mono">
                <span className="text-zinc-500">Latency</span>
                <span
                  className={`font-semibold ${
                    cap.status === 'UNAVAILABLE'
                      ? 'text-rose-400'
                      : cap.latency_ms > 200
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {cap.status === 'UNAVAILABLE' && cap.latency_ms === 0
                    ? 'TIMEOUT'
                    : `${cap.latency_ms} ms`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
