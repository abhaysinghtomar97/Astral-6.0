import React from 'react';
import { useMissionStore } from '../store/missionStore';

/**
 * TerminalHeader
 * Shows mission ID, a live "STREAMING" badge, and column labels.
 * Purely presentational — no polling logic here.
 */
export function TerminalHeader() {
  const { activeMission } = useMissionStore;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-900 shrink-0">
      <div className="flex items-center gap-3">
        {/* Traffic-light dots */}
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
        </div>
        <span className="text-slate-400 text-xs font-mono tracking-widest uppercase">
          {activeMission} — Event Stream
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Streaming indicator — CSS-only pulse */}
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-400 uppercase tracking-widest">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Streaming
        </span>
        <span className="text-slate-600 text-[10px] font-mono">2s poll</span>
      </div>
    </div>
  );
}
