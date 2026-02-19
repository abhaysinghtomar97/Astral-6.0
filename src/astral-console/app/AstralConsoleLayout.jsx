import React, { useRef, useCallback } from 'react';
import { MissionSelector } from './MissionSelector';
import { TerminalWindow } from './terminal/TerminalWindow';
import { FileUploadPanel } from './upload/FileUploadPanel';
import { DataBlocksPanel } from './data-blocks/DataBlocksPanel';
import { useMissionAPI } from './hooks/useMissionAPI';

/* ─────────────────────────────────────────────────────────────────────────────
   Design tokens — change these to retheme the entire console
───────────────────────────────────────────────────────────────────────────── */
const T = {
  bg:         '#080b10',
  bgPanel:    '#0a0d12',
  bgHeader:   '#0e1218',
  border:     '#1e2733',
  borderHi:   '#2d3a4a',
  text:       '#c9d1d9',
  textDim:    '#6b7280',
  textFaint:  '#374151',
  blue:       '#3b82f6',
  green:      '#22c55e',
  mono:       "'Courier New', 'Consolas', monospace",
};

/* ─────────────────────────────────────────────────────────────────────────────
   Injected global styles (scoped to .astral-console)
   This means zero dependency on Tailwind config.
───────────────────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  .astral-console * { box-sizing: border-box; }

  .astral-console {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: ${T.bg};
    color: ${T.text};
    font-family: ${T.mono};
  }

  /* ── Top bar ── */
  .ac-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-bottom: 1px solid ${T.border};
    background: ${T.bg};
    flex-shrink: 0;
    z-index: 10;
  }
  .ac-wordmark { display: flex; align-items: center; gap: 8px; }
  .ac-wordmark-name {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: #e2e8f0;
    text-transform: uppercase;
  }
  .ac-wordmark-sub {
    font-size: 10px;
    color: ${T.textDim};
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  .ac-topbar-right { display: flex; align-items: center; gap: 20px; }
  .ac-sysclock {
    font-size: 11px;
    color: ${T.textDim};
    letter-spacing: 0.12em;
    font-variant-numeric: tabular-nums;
  }

  /* ── Main grid ── */
  .ac-main {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    padding: 12px;
    gap: 12px;
  }
  .ac-terminal-half { flex: 1; min-height: 0; }
  .ac-bottom-row    { display: flex; gap: 12px; height: 44%; flex-shrink: 0; }
  .ac-bottom-row > * { flex: 1; min-width: 0; }

  /* ── Panel shell (shared by terminal, upload, data blocks) ── */
  .ac-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid ${T.border};
    border-radius: 2px;
    overflow: hidden;
  }
  .ac-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 16px;
    border-bottom: 1px solid ${T.border};
    background: ${T.bgHeader};
    flex-shrink: 0;
  }
  .ac-panel-title {
    font-size: 10px;
    letter-spacing: 0.18em;
    color: ${T.textDim};
    text-transform: uppercase;
  }

  /* ── Terminal ── */
  .ac-terminal-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px 16px;
    background: ${T.bgPanel};
    scrollbar-width: thin;
    scrollbar-color: #334155 transparent;
  }
  .ac-streaming-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: ${T.green};
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .ac-streaming-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${T.green};
    animation: ac-pulse 1.5s infinite;
  }
  .ac-poll-label { margin-left: 6px; color: ${T.textFaint}; font-size: 10px; }
  @keyframes ac-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }

  /* Terminal log lines */
  .ac-log-line { font-size: 11px; line-height: 1.7; white-space: pre-wrap; word-break: break-all; }
  .ac-log-ts   { color: #4b5563; user-select: none; margin-right: 8px; }
  .ac-log-sev  { font-size: 9px; color: #4b5563; user-select: none; margin-right: 8px;
                 text-transform: uppercase; letter-spacing: 0.08em; }
  .ac-sev-INFO           { color: #c9d1d9; }
  .ac-sev-WARNING        { color: #f59e0b; }
  .ac-sev-COLLISION_RISK { color: #ef4444; }
  .ac-sev-ML_PREDICTION  { color: #06b6d4; }

  /* ── Drop zone ── */
  .ac-dropzone {
    border: 2px dashed ${T.borderHi};
    border-radius: 2px;
    height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    user-select: none;
  }
  .ac-dropzone:hover, .ac-dropzone.drag-over {
    border-color: ${T.blue};
    background: rgba(59,130,246,0.06);
  }
  .ac-dropzone-icon { font-size: 22px; color: ${T.textDim}; line-height: 1; }
  .ac-dropzone-text { font-size: 11px; color: ${T.textDim}; }
  .ac-dropzone-hint { font-size: 10px; color: ${T.textFaint}; }

  /* Upload panel internals */
  .ac-upload-body  { display: flex; flex-direction: column; gap: 10px; padding: 14px; flex: 1; background: ${T.bgPanel}; overflow-y: auto; }
  .ac-file-row     { display: flex; justify-content: space-between; font-size: 11px; color: ${T.textDim}; margin-bottom: 4px; }
  .ac-file-name    { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%; }
  .ac-file-size    { color: ${T.textFaint}; flex-shrink: 0; margin-left: 8px; }
  .ac-progress-track { width: 100%; height: 3px; background: ${T.borderHi}; border-radius: 99px; overflow: hidden; margin-top: 4px; }
  .ac-progress-fill  { height: 100%; border-radius: 99px; transition: width 0.2s; }
  .ac-progress-pct   { display: flex; justify-content: space-between; font-size: 10px; color: ${T.textFaint}; margin-top: 2px; }
  .ac-status-ok  { font-size: 11px; color: ${T.green}; }
  .ac-status-err { font-size: 11px; color: #ef4444; }
  .ac-upload-hint { margin-top: auto; font-size: 10px; color: ${T.textFaint}; }
  .ac-btn-reset  { font-size: 10px; color: ${T.textFaint}; background: none; border: none;
                   cursor: pointer; font-family: inherit; letter-spacing: 0.1em;
                   text-transform: uppercase; }
  .ac-btn-reset:hover { color: ${T.text}; }

  /* ── Metric cards ── */
  .ac-metrics-body { display: flex; flex-direction: column; gap: 12px; padding: 14px; flex: 1; overflow-y: auto; background: ${T.bgPanel}; }
  .ac-metric-card  { border-left: 2px solid; padding: 4px 10px; }
  .ac-metric-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
  .ac-metric-dot    { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .ac-metric-label  { font-size: 9px; color: ${T.textFaint}; letter-spacing: 0.14em; text-transform: uppercase; }
  .ac-metric-value-row { display: flex; align-items: baseline; gap: 4px; }
  .ac-metric-value  { font-size: 20px; font-weight: 600; }
  .ac-metric-unit   { font-size: 11px; color: ${T.textDim}; }
  .ac-metric-sub    { font-size: 10px; color: ${T.textFaint}; margin-top: 2px; }

  .ac-c-info .ac-metric-card  { border-color: #374151; }
  .ac-c-info .ac-metric-value { color: #c9d1d9; }
  .ac-c-info .ac-metric-dot   { background: #c9d1d9; }
  .ac-c-ok   { border-color: #15803d !important; }
  .ac-c-ok   .ac-metric-value, .ac-c-ok   .ac-metric-dot { color: ${T.green}; background: ${T.green}; }
  .ac-c-warn { border-color: #92400e !important; }
  .ac-c-warn .ac-metric-value, .ac-c-warn .ac-metric-dot { color: #f59e0b; background: #f59e0b; }
  .ac-c-crit { border-color: #991b1b !important; }
  .ac-c-crit .ac-metric-value, .ac-c-crit .ac-metric-dot { color: #ef4444; background: #ef4444; }
  .ac-dot-crit { animation: ac-pulse 1s infinite; }

  .ac-no-data { font-size: 11px; color: ${T.textFaint}; }

  /* Mission selector */
  .ac-mission-wrap  { display: flex; align-items: center; gap: 8px; }
  .ac-mission-label { font-size: 10px; color: ${T.textDim}; letter-spacing: 0.15em; text-transform: uppercase; }
  .ac-mission-select {
    background: #1e2733;
    border: 1px solid ${T.borderHi};
    color: ${T.text};
    font-size: 11px;
    font-family: ${T.mono};
    padding: 5px 10px;
    border-radius: 2px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
  }
  .ac-mission-select:hover { border-color: #4b5563; }
  .ac-mission-select:focus { border-color: ${T.blue}; }

  /* Webkit scrollbar */
  .ac-terminal-scroll::-webkit-scrollbar,
  .ac-metrics-body::-webkit-scrollbar,
  .ac-upload-body::-webkit-scrollbar { width: 4px; }
  .ac-terminal-scroll::-webkit-scrollbar-thumb,
  .ac-metrics-body::-webkit-scrollbar-thumb,
  .ac-upload-body::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
  .ac-terminal-scroll::-webkit-scrollbar-track,
  .ac-metrics-body::-webkit-scrollbar-track,
  .ac-upload-body::-webkit-scrollbar-track { background: transparent; }
`;

/* Inject styles once */
function useConsoleStyles() {
  React.useEffect(() => {
    const id = 'astral-console-styles';
    if (document.getElementById(id)) return;
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = GLOBAL_CSS;
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components (all self-contained, no Tailwind)
───────────────────────────────────────────────────────────────────────────── */

function SystemClock() {
  const [time, setTime] = React.useState(() => utcNow());
  React.useEffect(() => {
    const id = setInterval(() => setTime(utcNow()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="ac-sysclock">{time} UTC</span>;
}
function utcNow() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Layout root
───────────────────────────────────────────────────────────────────────────── */
export function AstralConsoleLayout() {
  useConsoleStyles();
  useMissionAPI();

  const terminalRef = useRef(null);
  const handleMissionChange = useCallback(() => {
    terminalRef.current?.clearBuffer();
  }, []);

  return (
    <div className="astral-console">
      {/* Top bar */}
      <header className="ac-topbar">
        <div className="ac-wordmark">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="2.5" fill="#3b82f6" />
            <circle cx="9" cy="9" r="7"   stroke="#3b82f6" strokeWidth="1"   opacity="0.4" />
            <circle cx="9" cy="9" r="4.5" stroke="#3b82f6" strokeWidth="0.5" opacity="0.25" />
          </svg>
          <span className="ac-wordmark-name">Astral</span>
          <span className="ac-wordmark-sub">Mission Console</span>
        </div>
        <div className="ac-topbar-right">
          <MissionSelector onMissionChange={handleMissionChange} />
          <SystemClock />
        </div>
      </header>

      {/* Main grid */}
      <main className="ac-main">
        <div className="ac-terminal-half">
          <TerminalWindow ref={terminalRef} />
        </div>
        <div className="ac-bottom-row">
          <FileUploadPanel />
          <DataBlocksPanel />
        </div>
      </main>
    </div>
  );
}
