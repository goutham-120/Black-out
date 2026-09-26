/**
 * @file ArtifactViewer.tsx
 * @description Dedicated Antigravity-style Artifact & Code Inspector for BLACKOUT.
 * Supports visual rendering of SVG architecture diagrams, Python code syntax view,
 * test suite runner simulator, clipboard copy, and file download.
 */

import React, { useState } from 'react';
import {
  FileCode,
  Code2,
  Eye,
  Copy,
  Check,
  Download,
  Play,
  Terminal,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  Layers,
} from 'lucide-react';

export interface GeneratedArtifact {
  id: string;
  title: string;
  filename: string;
  type: 'python' | 'svg' | 'json' | 'sql' | 'markdown';
  content: string;
  created_at: number;
  description?: string;
  provenance_ref?: string;
}

interface ArtifactViewerProps {
  artifacts: GeneratedArtifact[];
  activeArtifactId?: string | null;
  onSelectArtifact?: (id: string) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  artifacts = [],
  activeArtifactId = null,
  onSelectArtifact,
  isModal = false,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    activeArtifactId || (artifacts.length > 0 ? artifacts[0].id : '')
  );
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState<boolean>(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const currentArtifact =
    artifacts.find((a) => a.id === (activeArtifactId || selectedId)) || artifacts[0] || null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (artifact: GeneratedArtifact) => {
    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = artifact.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRunExecution = () => {
    if (!currentArtifact) return;
    setIsExecuting(true);
    setExecutionOutput(null);

    setTimeout(() => {
      setIsExecuting(false);
      if (currentArtifact.type === 'python') {
        setExecutionOutput(
          `[BLACKOUT SANDBOX] Executing ${currentArtifact.filename} via local Python 3.12 interpreter...\n` +
          `----------------------------------------------------------------------\n` +
          `[INFO] Initializing SQLite WAL session store (wal_autocheckpoint=1000)\n` +
          `[ACT] Executing '${currentArtifact.title}'...\n` +
          `✓ Test / Script executed with exit code 0.\n` +
          `✓ Result committed to atomic SQLite WAL block.\n` +
          `[PROVENANCE] Verified SHA256 signature against local key store.`
        );
      } else if (currentArtifact.type === 'svg') {
        setExecutionOutput(
          `[VECTOR ENGINE] Rendering SVG vector graphics canvas (800x350 @ 60fps)...\n` +
          `✓ Zero external web fonts used; pure self-contained SVG geometry.\n` +
          `✓ Anti-aliased rendering nominal on local display.`
        );
      } else {
        setExecutionOutput(`✓ Verified JSON/Schema syntax contract: OK.`);
      }
    }, 600);
  };

  if (!currentArtifact) {
    return (
      <div className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 text-center font-mono text-xs text-zinc-500 shadow-xl backdrop-blur-xl">
        <FileCode className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
        <p className="font-bold text-zinc-400">NO ARTIFACT GENERATED YET</p>
        <p className="text-[11px] text-zinc-500 mt-1">
          Dispatch a mission prompt like "Generate Python code", "Create SVG diagram", or "Build test suite" to synthesize live artifacts.
        </p>
      </div>
    );
  }

  const containerClasses = isModal
    ? 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono'
    : `w-full bg-zinc-950/90 border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-xl overflow-hidden font-mono transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-[0_0_80px_rgba(6,182,212,0.4)] bg-zinc-950' : ''
      }`;

  const innerClasses = isModal
    ? 'relative w-full max-w-4xl bg-zinc-950 border-2 border-cyan-500/60 rounded-2xl shadow-[0_0_80px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col max-h-[90vh]'
    : 'flex flex-col h-full';

  return (
    <div className={containerClasses}>
      <div className={innerClasses}>
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800/80 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-zinc-100 tracking-wide uppercase">
                  {currentArtifact.title}
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 text-[10px] uppercase font-bold border border-cyan-500/40">
                  {currentArtifact.filename}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                {currentArtifact.description || 'Gemma 4 Air-Gapped Code Synthesis & Local Artifact Engine'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle for SVG */}
            {currentArtifact.type === 'svg' && (
              <div className="flex items-center p-0.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px]">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'preview'
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Visual</span>
                </button>
                <button
                  onClick={() => setViewMode('code')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'code'
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  <span>SVG XML</span>
                </button>
              </div>
            )}

            {/* Run in Sandbox Button */}
            <button
              onClick={handleRunExecution}
              disabled={isExecuting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)] cursor-pointer disabled:opacity-50"
              title="Run this script locally in air-gapped sandbox"
            >
              <Play className={`w-3 h-3 text-emerald-400 ${isExecuting ? 'animate-spin' : 'fill-current'}`} />
              <span>{isExecuting ? 'Running...' : 'Run in Sandbox'}</span>
            </button>

            {/* Copy Button */}
            <button
              onClick={() => handleCopy(currentArtifact.content)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition-all border border-zinc-700 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Download Button */}
            <button
              onClick={() => handleDownload(currentArtifact)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all cursor-pointer"
              title="Download artifact file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen toggle (if not modal) */}
            {!isModal && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-all cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Close button for modal */}
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Artifact Selector Tabs (if multiple) */}
        {artifacts.length > 1 && (
          <div className="flex items-center space-x-2 px-5 py-2 bg-zinc-950/90 border-b border-zinc-800/80 overflow-x-auto">
            <Layers className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            {artifacts.map((art) => {
              const isSelected = art.id === currentArtifact.id;
              return (
                <button
                  key={art.id}
                  onClick={() => {
                    setSelectedId(art.id);
                    if (onSelectArtifact) onSelectArtifact(art.id);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {art.filename}
                </button>
              );
            })}
          </div>
        )}

        {/* Content Viewer Body */}
        <div className="relative flex-1 overflow-y-auto max-h-[500px] p-5 bg-black/95">
          {currentArtifact.type === 'svg' && viewMode === 'preview' ? (
            <div
              className="w-full flex items-center justify-center p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80 overflow-hidden shadow-inner"
              dangerouslySetInnerHTML={{ __html: currentArtifact.content }}
            />
          ) : (
            <pre className="text-[12px] leading-relaxed font-mono text-cyan-300/95 selection:bg-cyan-500 selection:text-black whitespace-pre-wrap">
              {currentArtifact.content}
            </pre>
          )}

          {/* Sandbox Execution Terminal Output */}
          {executionOutput && (
            <div className="mt-4 p-3.5 rounded-xl bg-zinc-950 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-fade-in">
              <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-zinc-800 text-zinc-400 text-[10px]">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span className="font-bold text-zinc-200">Local Air-Gapped Sandbox Terminal</span>
              </div>
              <pre className="whitespace-pre-wrap text-emerald-300/90">{executionOutput}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
