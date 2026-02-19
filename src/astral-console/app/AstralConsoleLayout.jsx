import React, { useRef, useCallback } from 'react';
import { MissionSelector } from './MissionSelector';
import { TerminalWindow } from './terminal/TerminalWindow';
import { FileUploadPanel } from './upload/FileUploadPanel';
import { DataBlocksPanel } from './data-blocks/DataBlocksPanel';
import { useMissionAPI } from './hooks/useMissionAPI';

/**
 * AstralConsoleLayout
 *
 * Structural scaffold for the mission console.
 * Owns the imperative terminal ref so it can clear the buffer on mission switch.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────┐
 *   │  TopBar — Astral wordmark + MissionSelector          │
 *   ├─────────────────────────────────────────────────────┤
 *   │                                                     │
 *   │               Terminal (50% height)                  │
 *   │                                                     │
 *   ├──────────────────────┬──────────────────────────────┤
 *   │  FileUploadPanel     │  DataBlocksPanel             │
 *   │  (50% height, 50% w) │  (50% height, 50% w)         │
 *   └──────────────────────┴──────────────────────────────┘
 */
export function AstralConsoleLayout() {
  // Start polling as soon as this component mounts
  useMissionAPI();

  const terminalRef = useRef(null);

  const handleMissionChange = useCallback(() => {
    terminalRef.current?.clearBuffer();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#080b10] text-slate-200 overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-[#080b10] shrink-0 z-10">
        <div className="flex items-center gap-4">
          {/* Wordmark */}
          <div className="flex items-center gap-2">
            {/* Simple SVG star-like mark */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-blue-400">
              <circle cx="9" cy="9" r="2.5" fill="currentColor" />
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
            </svg>
            <span className="text-sm font-mono font-semibold tracking-[0.2em] text-slate-100 uppercase">
              Astral
            </span>
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
              Mission Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <MissionSelector onMissionChange={handleMissionChange} />
          {/* System clock */}
          <SystemClock />
        </div>
      </header>

      {/* ── Main grid ── */}
      <main className="flex flex-col flex-1 overflow-hidden p-3 gap-3">
        {/* Top half — Terminal */}
        <div className="flex-1 min-h-0">
          <TerminalWindow ref={terminalRef} />
        </div>

        {/* Bottom half — two panels */}
        <div className="flex gap-3" style={{ height: '45%' }}>
          <div className="flex-1 min-w-0">
            <FileUploadPanel />
          </div>
          <div className="flex-1 min-w-0">
            <DataBlocksPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

/** Tiny clock that re-renders on its own without affecting anything else. */
function SystemClock() {
  const [time, setTime] = React.useState(() => utcNow());

  React.useEffect(() => {
    const id = setInterval(() => setTime(utcNow()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-[11px] font-mono text-slate-500 tabular-nums tracking-widest">
      {time} UTC
    </span>
  );
}

function utcNow() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}
