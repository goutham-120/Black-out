/**
 * @file ProcessArchitecturePage.tsx
 * @description Comprehensive visual interactive guide explaining BLACKOUT's Input -> Process -> Output lifecycle.
 * Outlines the end-to-end air-gapped autonomy pipeline with live JSON schemas, flow diagrams, and execution logs.
 */

import React, { useState } from 'react';
import {
  Cpu,
  Database,
  ShieldCheck,
  Terminal,
  FileCode2,
  Layers,
  CheckCircle2,
  Radio,
} from 'lucide-react';

export const ProcessArchitecturePage: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);

  const stages = [
    {
      step: '01',
      id: 'input',
      title: '1. User Input & Dispatch',
      subtitle: 'Natural Language Coding or Operational Objective',
      icon: Terminal,
      color: 'cyan',
      description:
        'The developer enters a prompt via Google Antigravity, MCP tool call, or local web UI. No internet connection is required to receive and queue the task.',
      payloadSample: {
        interface: 'Google Antigravity MCP / Web UI',
        mode: 'AIR_GAPPED_LOCAL_FIRST',
        objective: 'Create a high-performance C program for Fibonacci benchmark and matrix operations',
        target_platform: 'Windows MSYS2 GCC / Linux',
        timestamp: new Date().toISOString(),
      },
    },
    {
      step: '02',
      id: 'sense',
      title: '2. SENSE Phase (Capabilities Probe)',
      subtitle: 'Hardware Matrix & Tool Latency Verification',
      icon: Radio,
      color: 'indigo',
      description:
        'The agent probes local NVMe storage, CPU/GPU latency, and tool readiness. If cloud WAN is down, it suppresses remote requests and confirms zero-cloud egress.',
      payloadSample: {
        hardware_latency_ms: 0.2,
        zero_cloud_egress: true,
        capabilities: {
          filesystem: { status: 'AVAILABLE', latency_ms: 0.1 },
          sqlite_wal: { status: 'AVAILABLE', latency_ms: 0.4 },
          local_gemma_llm: { status: 'AVAILABLE', latency_ms: 4.2 },
          internet: { status: 'UNAVAILABLE', latency_ms: 0.0, note: 'OFFLINE' },
        },
      },
    },
    {
      step: '03',
      id: 'wal',
      title: '3. Pre-Execution WAL Checkpoint',
      subtitle: 'Atomic Transaction Logging to SQLite WAL',
      icon: Database,
      color: 'purple',
      description:
        'CRUCIAL RESILIENCE STEP: Before writing any file or executing any compiler command, the pending step is journaled into SQLite WAL. If a powercut (SIGKILL) occurs, zero work is lost.',
      payloadSample: {
        status: 'CHECKPOINT_COMMITTED',
        wal_block_id: 'wal_chk_964cb750a8e7',
        step_id: 'step_antigravity_c_bench_01',
        action: 'write_and_compile_c_file',
        target_file: 'fibonacci_benchmark.c',
        preservation_guarantee: '100% Zero-Loss Crash Recovery',
      },
    },
    {
      step: '04',
      id: 'synthesis',
      title: '4. On-Device Gemma 4 Synthesis',
      subtitle: 'Quantized Local AI Code & Asset Generation',
      icon: Cpu,
      color: 'emerald',
      description:
        'Quantized Gemma 4 synthesizes production-grade C source code, Python microservices, or Vector SVG graphics on-device with zero cloud API dependencies.',
      payloadSample: {
        engine: 'Quantized Gemma 4 (On-Device)',
        artifact_generated: 'fibonacci_benchmark.c',
        lines_of_code: 68,
        provenance_sha256: '609b9dbcfc4b86076dde2b5be56fa4860cfdcc0556bf00db6e639ba529371fa9',
        trust_score: 0.99,
        egress_bytes: 0,
      },
    },
    {
      step: '05',
      id: 'execute',
      title: '5. Local Execution & Toolchain Sandbox',
      subtitle: 'Native GCC Compilation & Deterministic Verification',
      icon: Layers,
      color: 'amber',
      description:
        'The synthesized file is written to `./sandbox_fs/`, compiled using the local GCC compiler (`gcc.exe`), and executed to verify runtime output and cryptographic integrity.',
      payloadSample: {
        command: 'gcc backend/sandbox_fs/fibonacci_benchmark.c -o fibonacci_benchmark.exe',
        exit_code: 0,
        benchmark_output: {
          fibonacci_50: '12586269025 (Time: 0.0000 ms)',
          matrix_mult_64x64: 'Complete (Time: 2.0000 ms)',
        },
        status: 'DETERMINISTIC_VERIFICATION_SUCCESS',
      },
    },
    {
      step: '06',
      id: 'output',
      title: '6. Verified Output & Artifact Delivery',
      subtitle: 'Disk Persistence & Antigravity Telemetry Update',
      icon: FileCode2,
      color: 'rose',
      description:
        'The completed artifacts and updated SQLite WAL mission state are finalized. The developer receives compiled binaries, source files, and visual SVGs on disk.',
      payloadSample: {
        artifacts_on_disk: [
          'fibonacci_benchmark.c (1,962 bytes)',
          'fibonacci_benchmark.exe (Compiled Binary)',
          'system_architecture.svg (Vector Image)',
          'generated_telemetry_chart.png (Raster Image)',
        ],
        mission_status: 'COMPLETED',
        total_time_ms: 1240,
        cloud_tokens_used: 0,
      },
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              ARCHITECTURE &amp; PROCESS
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              AIR-GAPPED LIFECYCLE
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white font-mono">
            Input <span className="text-cyan-400">&rarr;</span> Process <span className="text-cyan-400">&rarr;</span> Output Architecture
          </h1>
          <p className="text-sm lg:text-base text-zinc-300 leading-relaxed font-sans">
            How BLACKOUT transforms prompts into compiled, verified software and graphics completely on-device without internet access, backed by atomic SQLite Write-Ahead Logging.
          </p>
        </div>
      </div>

      {/* Interactive Process Pipeline Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelected = activeStage === idx;
          return (
            <button
              key={stage.id}
              onClick={() => setActiveStage(idx)}
              className={`p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer border relative ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.25)] text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-zinc-500">STAGE {stage.step}</span>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-zinc-500'}`} />
              </div>
              <div className="text-xs font-bold font-mono truncate text-zinc-100">{stage.title.split('. ')[1]}</div>
              <div className="text-[10px] text-zinc-400 truncate mt-0.5">{stage.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Active Stage Detailed Breakdown & Live Payload Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Explanation Card */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {React.createElement(stages[activeStage].icon, { className: 'w-6 h-6' })}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400">STAGE {stages[activeStage].step} DEEP DIVE</span>
              <h2 className="text-xl font-bold text-white font-mono">{stages[activeStage].title}</h2>
            </div>
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed">
            {stages[activeStage].description}
          </p>

          <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800/80 space-y-2 font-mono text-xs">
            <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Key Guarantees in this Stage:</div>
            <ul className="space-y-1.5 text-zinc-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero Cloud Dependencies (100% on-device execution)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Deterministic SHA-256 Provenance Checksumming</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Atomic SQLite WAL State Commit before every mutation</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right JSON Schema / Data Payload Explorer */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <span className="text-xs font-bold text-zinc-400 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>LIVE TELEMETRY / DATA PAYLOAD</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              application/json
            </span>
          </div>

          <pre className="p-4 rounded-2xl bg-black/70 border border-zinc-800 text-xs text-cyan-300 overflow-x-auto leading-relaxed max-h-[380px] overflow-y-auto">
            {JSON.stringify(stages[activeStage].payloadSample, null, 2)}
          </pre>
        </div>
      </div>

      {/* Summary Comparison: Cloud vs Air-Gapped Local-First */}
      <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <h3 className="text-lg font-bold text-white font-mono flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Why This Pipeline Never Breaks Under Environmental Outages</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800 space-y-2">
            <div className="text-xs font-bold font-mono text-cyan-400">1. Powercut Resilience</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              In-memory state can be wiped out by sudden SIGKILL or power outage, but SQLite WAL commits write-ahead records to disk before execution begins.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800 space-y-2">
            <div className="text-xs font-bold font-mono text-emerald-400">2. Zero WiFi Dependency</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Quantized Gemma 4 models run directly in local memory. Code, tests, and vector images are created on local SSD with 0.0ms egress latency.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800 space-y-2">
            <div className="text-xs font-bold font-mono text-purple-400">3. Native Toolchain Execution</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Synthesized programs are immediately compiled and tested using local GCC compilers, Python engines, and image renderers on your machine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
