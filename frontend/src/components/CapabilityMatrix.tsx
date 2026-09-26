/**
 * @file CapabilityMatrix.tsx
 * @description Renders the real-time capability probe status matrix for BLACKOUT.
 * Represents the SENSE phase of the autonomous loop by visualizing live health,
 * latency, and staleness across local models, caches, databases, and network adapters.
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
  HelpCircle,
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
  category: 'Local Core' | 'Storage & State' | 'External Network';
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
    category: 'Storage & State',
    icon: HardDrive,
  },
  {
    key: 'local_cache',
    aliases: ['cache', 'storage_cache'],
    label: 'Local Cache Store',
    category: 'Storage & State',
    icon: Database,
  },
  {
    key: 'sqlite_wal',
    aliases: ['sync_queue', 'wal_db', 'sqlite', 'persistence'],
    label: 'Sync Queue / WAL DB',
    category: 'Storage & State',
    icon: Layers,
  },
  {
    key: 'internet',
    aliases: ['network', 'wan', 'gateway'],
    label: 'Internet Gateway',
    category: 'External Network',
    icon: Wifi,
  },
  {
    key: 'calendar',
    aliases: ['calendar_api', 'gcal'],
    label: 'Calendar API',
    category: 'External Network',
    icon: Calendar,
  },
  {
    key: 'weather_api',
    aliases: ['weather', 'noaa_api'],
    label: 'Weather Radar API',
    category: 'External Network',
    icon: CloudSun,
  },
];

function getStatusBadgeStyle(status: CapabilityStatus): {
  badge: string;
  cardBorder: string;
  glow: string;
  dot: string;
} {
  switch (status) {
    case 'AVAILABLE':
      return {
        badge: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
        cardBorder: 'border-emerald-500/30 hover:border-emerald-500/60',
        glow: 'text-emerald-400',
        dot: 'bg-emerald-400 animate-pulse',
      };
    case 'DEGRADED':
      return {
        badge: 'bg-amber-950/80 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
        cardBorder: 'border-amber-500/40 hover:border-amber-500/70',
        glow: 'text-amber-400',
        dot: 'bg-amber-400',
      };
    case 'STALE':
      return {
        badge: 'bg-orange-950/80 text-orange-400 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
        cardBorder: 'border-orange-500/40 hover:border-orange-500/70',
        glow: 'text-orange-400',
        dot: 'bg-orange-400',
      };
    case 'UNAVAILABLE':
      return {
        badge: 'bg-rose-950/80 text-rose-400 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse',
        cardBorder: 'border-rose-500/50 hover:border-rose-500/80',
        glow: 'text-rose-400',
        dot: 'bg-rose-500 animate-ping',
      };
    default:
      return {
        badge: 'bg-zinc-900 text-zinc-400 border-zinc-700',
        cardBorder: 'border-zinc-800 hover:border-zinc-700',
        glow: 'text-zinc-400',
        dot: 'bg-zinc-500',
      };
  }
}

export const CapabilityMatrix: React.FC<CapabilityMatrixProps> = ({ capabilities }) => {
  const resolveCapability = (def: CapabilityMeta): Capability => {
    if (capabilities[def.key]) {
      return capabilities[def.key];
    }
    for (const alias of def.aliases) {
      if (capabilities[alias]) {
        return capabilities[alias];
      }
    }
    return {
      status: 'UNKNOWN',
      latency_ms: 0,
      details: 'Probe inactive or capability unmapped.',
    };
  };

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100 font-mono">
              Live Capability Matrix
            </h3>
            <p className="text-xs text-zinc-400">
              Active hardware probes &amp; fallback readiness telemetry
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>SENSE LOOP: 1000ms</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {CAPABILITY_DEFINITIONS.map((def) => {
          const cap = resolveCapability(def);
          const styles = getStatusBadgeStyle(cap.status);
          const Icon = def.icon;

          return (
            <div
              key={def.key}
              className={`relative flex flex-col justify-between p-3.5 rounded-lg bg-zinc-900/90 border ${styles.cardBorder} transition-all duration-200 hover:scale-[1.01]`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-md bg-zinc-800/80 border border-zinc-700/50 ${styles.glow}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200 font-mono tracking-tight leading-tight">
                        {def.label}
                      </h4>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                        {def.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${styles.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                    <span>{cap.status}</span>
                  </span>
                </div>

                <p className="text-[11px] leading-relaxed text-zinc-400 line-clamp-2 mt-1">
                  {cap.details || 'Operational status steady.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-400">
                <span className="text-zinc-500">Latency</span>
                <span
                  className={`font-semibold ${
                    cap.latency_ms > 200
                      ? 'text-amber-400'
                      : cap.latency_ms === 0 && cap.status === 'UNAVAILABLE'
                      ? 'text-rose-400'
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
