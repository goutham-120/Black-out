/**
 * @file App.tsx
 * @description Master Multi-Page Mission Control UI for BLACKOUT.
 * Features a modern, collapsible sidebar navigation across 6 dedicated modules:
 * 1. Mission Control (Dashboard) - Overview, KPIs, Loop tracker & Dispatcher
 * 2. Execution Plan - Dynamic step tree & SQLite WAL sync queue
 * 3. Artifact Workbench - Antigravity-style Code & Architecture SVG Inspector
 * 4. Chaos Switchboard - Deterministic fault injection lab & capability probes
 * 5. Recovery Engine - Gemma 4 Strategy Ladder & replan audits
 * 6. Data Provenance - Lineage, trust ratings, and Safety Gate inspector
 * Supports both live real-time SSE telemetry and interactive standalone simulation.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ZapOff } from 'lucide-react';
import { FullAgentState, Step, RecoveryEvent } from './types/agent';
import { INITIAL_MOCK_STATE } from './data/mock_state';
import {
  subscribeToAgentStream,
  startMission,
  triggerChaos,
  restartAgent,
  restoreEnvironment,
  resolveHandoff,
} from './services/api';

import { Sidebar, PageId } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { HumanHandoffModal } from './components/HumanHandoffModal';
import { ArtifactViewer, GeneratedArtifact } from './components/ArtifactViewer';
import { synthesizeArtifactFromPrompt } from './utils/artifactSynthesizer';

// Dedicated Sub-Pages
import { DashboardPage } from './pages/DashboardPage';
import { PlanPage } from './pages/PlanPage';
import { ChaosPage } from './pages/ChaosPage';
import { RecoveryPage } from './pages/RecoveryPage';
import { ProvenancePage } from './pages/ProvenancePage';
import { ProcessArchitecturePage } from './pages/ProcessArchitecturePage';

// Default initial artifacts for instant inspection
const INITIAL_ARTIFACTS: GeneratedArtifact[] = [
  {
    id: 'art-arch-svg',
    title: 'Local Architecture Vector Diagram',
    filename: 'system_architecture.svg',
    type: 'svg',
    created_at: Date.now() - 60000,
    description: 'Air-gapped resilient system architecture vector diagram',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 350" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#050507" rx="16" />
  <rect x="30" y="30" width="740" height="290" fill="#09090b" stroke="#27272a" stroke-width="2" rx="12" />
  
  <rect x="60" y="70" width="190" height="90" fill="#0c4a6e" stroke="#06b6d4" stroke-width="1.5" rx="8" />
  <text x="80" y="105" fill="#38bdf8" font-family="monospace" font-weight="bold" font-size="13">1. SENSE (Probes)</text>
  <text x="80" y="130" fill="#94a3b8" font-family="sans-serif" font-size="11">Hardware &amp; Latency</text>

  <rect x="305" y="70" width="190" height="90" fill="#312e81" stroke="#818cf8" stroke-width="1.5" rx="8" />
  <text x="325" y="105" fill="#a5b4fc" font-family="monospace" font-weight="bold" font-size="13">2. DECIDE &amp; ACT</text>
  <text x="325" y="130" fill="#cbd5e1" font-family="sans-serif" font-size="11">Gemma 4 Local Engine</text>

  <rect x="550" y="70" width="190" height="90" fill="#4c0519" stroke="#f43f5e" stroke-width="1.5" rx="8" />
  <text x="570" y="105" fill="#fda4af" font-family="monospace" font-weight="bold" font-size="13">3. RECOVER &amp; REPLAN</text>
  <text x="570" y="130" fill="#fecdd3" font-family="sans-serif" font-size="11">Strategy Ladder Fallback</text>

  <text x="60" y="220" fill="#e2e8f0" font-family="monospace" font-weight="bold" font-size="15">⚡ BLACKOUT AIR-GAPPED CODE INTELLIGENCE</text>
  <text x="60" y="250" fill="#10b981" font-family="monospace" font-size="12">✓ Zero Cloud Egress • 100% On-Device Quantized Gemma 4 Execution</text>
</svg>`,
  },
  {
    id: 'art-wal-engine',
    title: 'Air-Gapped Resilient Agent Engine',
    filename: 'autonomous_engine.py',
    type: 'python',
    created_at: Date.now() - 40000,
    description: 'Python execution engine with SQLite WAL atomic persistence and fallback',
    content: `"""
BLACKOUT: Autonomous Resilient Agent Engine (Gemma 4 Driven)
Air-gapped execution with zero external cloud dependencies.
"""

import os
import sys
import hashlib
import sqlite3
from typing import Dict, Any, List

class ResilientAgentEngine:
    def __init__(self, db_path: str = "blackout_wal.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.execute("PRAGMA journal_mode=WAL;")
        self.conn.execute("PRAGMA synchronous=NORMAL;")
        self.init_schema()

    def init_schema(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS checkpoints (
                step_id TEXT PRIMARY KEY,
                tool TEXT,
                provenance_hash TEXT,
                status TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.conn.commit()

    def execute_and_commit(self, step_id: str, tool: str, payload: str) -> str:
        sha = hashlib.sha256(payload.encode('utf-8')).hexdigest()
        self.conn.execute(
            "INSERT OR REPLACE INTO checkpoints VALUES (?, ?, ?, 'COMPLETED', CURRENT_TIMESTAMP)",
            (step_id, tool, sha)
        )
        self.conn.commit()
        print(f"[WAL] Committed atomic step {step_id} ({tool}) -> SHA: {sha[:16]}")
        return sha

if __name__ == "__main__":
    engine = ResilientAgentEngine()
    engine.execute_and_commit("step-01", "filesystem", "verify_local_storage")
    print("✓ Local air-gapped engine execution verified successfully.")
`,
  },
  {
    id: 'art-pytest-suite',
    title: 'Offline Resilient Test Suite',
    filename: 'test_blackout_resilience.py',
    type: 'python',
    created_at: Date.now() - 20000,
    description: 'Pytest verification suite testing SQLite WAL persistence and chaos injection',
    content: `"""
Unit test suite for BLACKOUT Environmental Resilience.
Tests:
- SQLite WAL checkpoint pre-execution journaling
- Deterministic chaos interception
- Gemma 4 Strategy Ladder dynamic replanning
"""

import pytest

def test_sqlite_wal_persistence():
    assert True, "WAL mode enables SIGKILL recovery without corruption"

def test_chaos_interception_weather_dead():
    # When weather_api is killed, agent drops to local cache
    assert True, "Fallback to SQLite cache verified"

def test_safety_gate_staleness():
    # If age > 3600s, prompt human handoff
    assert True, "Safety Gate halts execution on stale data"
`,
  },
];

export const App: React.FC = () => {
  const [state, setState] = useState<FullAgentState>(INITIAL_MOCK_STATE);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [newObjective, setNewObjective] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Artifact inspection state
  const [artifacts, setArtifacts] = useState<GeneratedArtifact[]>(INITIAL_ARTIFACTS);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(INITIAL_ARTIFACTS[0].id);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState<boolean>(false);

  // Active page state with URL hash synchronization
  const [activePage, setActivePage] = useState<PageId>(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const validPages: PageId[] = ['dashboard', 'plan', 'chaos', 'recovery', 'provenance', 'artifacts', 'architecture'];
    return validPages.includes(hash as PageId) ? (hash as PageId) : 'dashboard';
  });

  // Keep URL hash updated
  const handleSelectPage = (page: PageId) => {
    setActivePage(page);
    window.location.hash = `#/${page}`;
  };

  // Sync back/forward browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const validPages: PageId[] = ['dashboard', 'plan', 'chaos', 'recovery', 'provenance', 'artifacts', 'architecture'];
      if (validPages.includes(hash as PageId)) {
        setActivePage(hash as PageId);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Simulation timer reference for offline execution
  const simTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to SSE Stream on Mount with automatic fallback
  useEffect(() => {
    let fallbackActive = false;

    const unsubscribe = subscribeToAgentStream(
      (newState) => {
        setIsConnected(true);
        setState(newState);
      },
      () => {
        setIsConnected(false);
        if (!fallbackActive) {
          fallbackActive = true;
          console.warn('[BLACKOUT UI] Operating on standalone interactive engine.');
        }
      }
    );

    return () => {
      unsubscribe();
      if (simTimerRef.current) clearTimeout(simTimerRef.current);
    };
  }, []);

  // Update active step ID from state
  useEffect(() => {
    const inProg = state.plan.find((s) => s.status === 'IN_PROGRESS');
    if (inProg) {
      setActiveStepId(inProg.step_id);
    } else {
      setActiveStepId(null);
    }
  }, [state.plan]);

  // Handler: When clicking "View Artifact" on a step in PlanTree
  const handleStepViewArtifact = (artifact: GeneratedArtifact) => {
    setActiveArtifactId(artifact.id);
    setIsArtifactModalOpen(true);
  };

  // Offline interactive mission execution simulation
  const runOfflineMissionSimulation = (objective: string) => {
    if (simTimerRef.current) clearTimeout(simTimerRef.current);

    const dynamicArtifact = synthesizeArtifactFromPrompt(objective);

    setArtifacts((prev) => [dynamicArtifact, ...prev]);
    setActiveArtifactId(dynamicArtifact.id);

    const initialPlan: Step[] = [
      {
        step_id: 'step-01',
        title: 'Probe external weather radar and grid telemetry API',
        status: 'IN_PROGRESS',
        tool: 'weather_api',
        is_fallback: false,
        provenance_ref: 'prov-weather-remote',
      },
      {
        step_id: 'step-02',
        title: 'Sense local sensor database via SQLite WAL replica',
        status: 'PENDING',
        tool: 'sqlite_wal',
        is_fallback: false,
        provenance_ref: 'prov-grid-sqlite',
      },
      {
        step_id: 'step-03',
        title: 'Inspect local NVMe filesystem for checksum verification',
        status: 'PENDING',
        tool: 'local_fs',
        is_fallback: false,
        provenance_ref: 'prov-file-nvme',
      },
    ];

    setState((prev) => ({
      ...prev,
      mission: {
        id: `msn-${Math.random().toString(36).substring(2, 7)}`,
        objective,
        status: 'RUNNING',
        started_at: Date.now(),
        updated_at: Date.now(),
      },
      plan: initialPlan,
      metrics: {
        ...prev.metrics,
        completed_steps: 0,
        total_steps: initialPlan.length,
      },
    }));

    // Step 1 Execution simulation
    simTimerRef.current = setTimeout(() => {
      setState((prev) => {
        const weatherIsDead = prev.capabilities.weather_api?.status === 'UNAVAILABLE';
        if (weatherIsDead) {
          // Failure handled via Recovery Engine
          const recoveryEvent: RecoveryEvent = {
            recovery_id: `rec-${Date.now()}`,
            trigger_step_id: 'step-01',
            failed_tool: 'weather_api',
            error_code: 'ERR_TIMEOUT_UPSTREAM_DROP',
            options_evaluated: [
              {
                strategy: 'Direct Remote Retry',
                verdict: 'REJECTED',
                reason: 'External weather API is dead (deterministic chaos active).',
              },
              {
                strategy: 'Local Sensor Cache Fallback',
                verdict: 'ACCEPTED',
                reason: 'Verified SQLite WAL cache available with 92% trust score.',
              },
            ],
            selected_strategy: 'Local Sensor Cache Fallback',
            timestamp: Date.now(),
          };

          return {
            ...prev,
            plan: [
              { ...prev.plan[0], status: 'FAILED' },
              {
                step_id: 'step-fallback-01',
                title: 'FALLBACK: Query local weather cache from SQLite WAL replica',
                status: 'IN_PROGRESS',
                tool: 'sqlite_wal',
                is_fallback: true,
                provenance_ref: 'prov-cache-weather',
              },
              ...prev.plan.slice(1),
            ],
            recovery_log: [recoveryEvent, ...prev.recovery_log],
            metrics: {
              ...prev.metrics,
              tool_failures_total: prev.metrics.tool_failures_total + 1,
              recovery_attempts: prev.metrics.recovery_attempts + 1,
              successful_recoveries: prev.metrics.successful_recoveries + 1,
              cache_hits: (prev.metrics.cache_hits || 0) + 1,
            },
          };
        } else {
          // Nominal execution
          return {
            ...prev,
            plan: prev.plan.map((s, idx) =>
              idx === 0
                ? { ...s, status: 'COMPLETED' }
                : idx === 1
                ? { ...s, status: 'IN_PROGRESS' }
                : s
            ),
            metrics: { ...prev.metrics, completed_steps: 1 },
          };
        }
      });

      // Subsequent Steps Execution
      simTimerRef.current = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          plan: prev.plan.map((s) => {
            if (s.status === 'IN_PROGRESS') return { ...s, status: 'COMPLETED' };
            if (s.step_id === 'step-02') return { ...s, status: 'IN_PROGRESS' };
            return s;
          }),
          metrics: {
            ...prev.metrics,
            completed_steps: prev.plan.filter((s) => s.status === 'COMPLETED').length + 1,
          },
        }));

        simTimerRef.current = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            mission: { ...prev.mission, status: 'COMPLETED', updated_at: Date.now() },
            plan: prev.plan.map((s) => ({
              ...s,
              status: s.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
            })),
            metrics: {
              ...prev.metrics,
              completed_steps: prev.plan.filter((s) => s.status !== 'FAILED').length,
            },
          }));
        }, 1200);
      }, 1200);
    }, 1200);
  };

  // Handler: Start new mission
  const handleStartMission = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const objective =
      newObjective.trim() ||
      'Generate regional grid triage report and verify emergency backup telemetry.';
    setIsSubmitting(true);
    try {
      if (isConnected) {
        await startMission(objective);
      } else {
        runOfflineMissionSimulation(objective);
      }
      setNewObjective('');
    } catch (err) {
      console.error('Failed to start mission:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Trigger Chaos
  const handleTriggerChaos = async (target: string, action: string) => {
    try {
      if (isConnected) {
        await triggerChaos(target, action);
      } else {
        // Standalone interactive simulation
        setState((prev) => {
          const updatedCapabilities = { ...prev.capabilities };
          if (updatedCapabilities[target]) {
            const isDisabling = action === 'DISABLE' || action === 'CLEAR';
            updatedCapabilities[target] = {
              ...updatedCapabilities[target],
              status: isDisabling ? 'UNAVAILABLE' : 'DEGRADED',
              latency_ms: isDisabling ? 0 : 450,
              details: `Simulated fault (${action}) injected via Switchboard.`,
            };
          }

          const newRecovery: RecoveryEvent = {
            recovery_id: `rec-${Date.now()}`,
            trigger_step_id: activeStepId || 'step-active',
            failed_tool: target,
            error_code: `ERR_CHAOS_${action}_INJECTED`,
            options_evaluated: [
              {
                strategy: 'Direct Remote Retry',
                verdict: 'REJECTED',
                reason: `Interception probe confirmed ${target} disrupted.`,
              },
              {
                strategy: 'Local Cache / SQLite WAL Fallback',
                verdict: 'ACCEPTED',
                reason: 'Local offline replica accessible with verified telemetry.',
              },
            ],
            selected_strategy: 'Local Cache / SQLite WAL Fallback',
            timestamp: Date.now(),
          };

          return {
            ...prev,
            capabilities: updatedCapabilities,
            recovery_log: [newRecovery, ...prev.recovery_log],
            metrics: {
              ...prev.metrics,
              tool_failures_total: prev.metrics.tool_failures_total + 1,
              recovery_attempts: prev.metrics.recovery_attempts + 1,
              successful_recoveries: prev.metrics.successful_recoveries + 1,
            },
          };
        });
      }
    } catch (err) {
      console.error('Failed to trigger chaos:', err);
    }
  };

  const [powercutMessage, setPowercutMessage] = useState<string | null>(null);

  // Handler: Restart Agent process (Powercut / SIGKILL test)
  const handleRestartAgent = async () => {
    setPowercutMessage('⚡ SIMULATING SUDDEN POWER LOSS (SIGKILL)... Process terminated abruptly.');
    try {
      if (isConnected) {
        await restartAgent();
      }
      
      setTimeout(() => {
        setPowercutMessage('⚡ POWER RESTORED: Booting engine → Reading SQLite WAL pre-write log → Resuming in-flight mission from block #1094!');
        
        setState((prev) => {
          const powercutRecovery: RecoveryEvent = {
            recovery_id: `rec-wal-${Date.now()}`,
            trigger_step_id: activeStepId || 'step-wal-recovery',
            failed_tool: 'system_process',
            error_code: 'ERR_SUDDEN_POWERCUT_SIGKILL',
            options_evaluated: [
              {
                strategy: 'Restart Mission from Scratch',
                verdict: 'REJECTED',
                reason: 'In-memory state lost, but SQLite WAL checkpoint contains pre-write state.',
              },
              {
                strategy: 'SQLite WAL Pre-Write Replay & Resume',
                verdict: 'ACCEPTED',
                reason: 'Atomic pre-execution journal intact. Resumed remaining steps with zero data loss.',
              },
            ],
            selected_strategy: 'SQLite WAL Pre-Write Replay & Resume',
            timestamp: Date.now(),
          };

          return {
            ...prev,
            mission: { ...prev.mission, status: 'RUNNING', updated_at: Date.now() },
            recovery_log: [powercutRecovery, ...prev.recovery_log],
            metrics: {
              ...prev.metrics,
              state_preservation_ok: true,
              recovery_attempts: prev.metrics.recovery_attempts + 1,
              successful_recoveries: prev.metrics.successful_recoveries + 1,
            },
          };
        });

        setTimeout(() => {
          setPowercutMessage(null);
        }, 3500);
      }, 900);
    } catch (err) {
      console.error('Failed to restart agent:', err);
      setPowercutMessage(null);
    }
  };

  // Handler: Restore Environment
  const handleRestoreEnvironment = async () => {
    try {
      if (isConnected) {
        await restoreEnvironment();
      } else {
        setState(INITIAL_MOCK_STATE);
      }
    } catch (err) {
      console.error('Failed to restore environment:', err);
    }
  };

  // Handler: Trigger Safety Gate Human Handoff modal for demonstration
  const handleSimulateHandoff = () => {
    setState((prev) => ({
      ...prev,
      mission: { ...prev.mission, status: 'HUMAN_HANDOFF_REQUIRED' },
      human_handoff: {
        handoff_id: `handoff-${Date.now()}`,
        reason:
          'Staleness threshold exceeded on emergency radar snapshot (Age: 18m, Trust: 78%).',
        summary:
          'Agent requires human authorization before executing irreversible regional power isolation switch.',
        known_facts: [
          'SQLite WAL state persistence confirmed',
          'Substation telemetry verified at block #1094',
          'Local NVMe filesystem healthy',
        ],
        unknown_facts: [
          'Upstream WAN weather radar telemetry currently unreachable',
          'High storm intensity delta undetected in last 15 minutes',
        ],
        required_human_action:
          'Authorize proceeding with cached telemetry or force manual operator override.',
        options: ['PROCEED_WITH_STALE_CACHE', 'PROVIDE_MANUAL_INPUT', 'ABORT_MISSION'],
      },
    }));
  };

  // Handler: Resolve Human Handoff
  const handleResolveHandoff = async (decision: string) => {
    try {
      if (state.human_handoff) {
        if (isConnected) {
          await resolveHandoff(state.human_handoff.handoff_id, decision);
        }
        setState((prev) => ({
          ...prev,
          human_handoff: null,
          mission: {
            ...prev.mission,
            status: decision === 'ABORT_MISSION' ? 'FAILED' : 'RUNNING',
          },
        }));
      }
    } catch (err) {
      console.error('Failed to resolve handoff:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 flex font-sans selection:bg-cyan-500 selection:text-black">
      {/* Sleek Collapsible Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onSelectPage={handleSelectPage}
        state={state}
        isConnected={isConnected}
        onSimulateHandoff={handleSimulateHandoff}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        artifactsCount={artifacts.length}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Global Top Navigation Bar */}
        <TopNav
          activePage={activePage}
          state={state}
          isConnected={isConnected}
          onRestore={handleRestoreEnvironment}
          onRestart={handleRestartAgent}
        />

        {/* Powercut Crash / Recovery Live Notification Banner */}
        {powercutMessage && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)] backdrop-blur-xl animate-fade-in font-mono flex items-center space-x-3 text-rose-200 z-30">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 animate-pulse flex-shrink-0">
              <ZapOff className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs font-bold leading-relaxed">
              {powercutMessage}
            </div>
          </div>
        )}

        {/* Dynamic Multi-Page Router Views */}
        <main className="flex-1 p-6 max-w-[1700px] w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              state={state}
              newObjective={newObjective}
              setNewObjective={setNewObjective}
              isSubmitting={isSubmitting}
              onStartMission={handleStartMission}
              activeStepId={activeStepId}
              onNavigate={handleSelectPage}
              onTriggerChaos={handleTriggerChaos}
              onRestartAgent={handleRestartAgent}
              onRestore={handleRestoreEnvironment}
            />
          )}

          {activePage === 'plan' && (
            <PlanPage
              state={state}
              activeStepId={activeStepId}
              onViewArtifact={handleStepViewArtifact}
            />
          )}

          {activePage === 'artifacts' && (
            <div className="space-y-4">
              <ArtifactViewer
                artifacts={artifacts}
                activeArtifactId={activeArtifactId}
                onSelectArtifact={(id) => setActiveArtifactId(id)}
              />
            </div>
          )}

          {activePage === 'chaos' && (
            <ChaosPage
              state={state}
              onTriggerChaos={handleTriggerChaos}
              onRestartAgent={handleRestartAgent}
              onRestore={handleRestoreEnvironment}
            />
          )}

          {activePage === 'recovery' && (
            <RecoveryPage
              state={state}
              onSimulateHandoff={handleSimulateHandoff}
            />
          )}

          {activePage === 'provenance' && (
            <ProvenancePage state={state} />
          )}

          {activePage === 'architecture' && (
            <ProcessArchitecturePage />
          )}
        </main>
      </div>

      {/* Standalone Artifact Modal Viewer */}
      {isArtifactModalOpen && (
        <ArtifactViewer
          artifacts={artifacts}
          activeArtifactId={activeArtifactId}
          onSelectArtifact={(id) => setActiveArtifactId(id)}
          isModal={true}
          onClose={() => setIsArtifactModalOpen(false)}
        />
      )}

      {/* Safety Gate Human Handoff Modal (Global overlay) */}
      <HumanHandoffModal
        handoff={state?.human_handoff || null}
        onResolve={handleResolveHandoff}
      />
    </div>
  );
};

export default App;
