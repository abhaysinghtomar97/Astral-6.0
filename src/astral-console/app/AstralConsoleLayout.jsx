import React, { useRef, useCallback, useEffect, useState } from 'react';
import { MissionSelector }  from './MissionSelector';
import { TerminalWindow }   from './terminal/TerminalWindow';
import { FileUploadPanel }  from './upload/FileUploadPanel';
import { DataBlocksPanel }  from './data-blocks/DataBlocksPanel';
import { HistoryPanel }     from './history/HistoryPanel';
import { LoginScreen }      from './auth/LoginScreen';
import { useAuthStore }     from './store/authStore';
import { useMissionStore }  from './store/missionStore';
import { useTelemetryStore } from './store/telemetryStore';
import { useHistoryStore }  from './store/historyStore';
import { useMissionAPI }    from './hooks/useMissionAPI';

/* ─────────────────────────────────────────────────────────────────────────────
   Design tokens & injected CSS (no Tailwind dependency)
───────────────────────────────────────────────────────────────────────────── */
const T = {
  bg: '#080b10', bgPanel: '#0a0d12', bgHeader: '#0e1218',
  border: '#1e2733', borderHi: '#2d3a4a',
  text: '#c9d1d9', textDim: '#6b7280', textFaint: '#374151',
  blue: '#3b82f6', green: '#22c55e', mono: "'Courier New', Consolas, monospace",
};

const GLOBAL_CSS = `
  .astral-console *, .astral-console *::before, .astral-console *::after { box-sizing: border-box; }
  .astral-console {
    display: flex; flex-direction: column; height: 100vh; overflow: hidden;
    background: ${T.bg}; color: ${T.text}; font-family: ${T.mono};
    position: fixed; inset: 0; z-index: 100;
  }
  .ac-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 20px; border-bottom: 1px solid ${T.border};
    background: ${T.bg}; flex-shrink: 0; z-index: 10;
  }
  .ac-wordmark { display: flex; align-items: center; gap: 8px; }
  .ac-wordmark-name { font-size: 13px; font-weight: 600; letter-spacing: 0.2em; color: #e2e8f0; text-transform: uppercase; }
  .ac-wordmark-sub  { font-size: 10px; color: ${T.textDim}; letter-spacing: 0.15em; text-transform: uppercase; }
  .ac-topbar-right  { display: flex; align-items: center; gap: 16px; }
  .ac-sysclock      { font-size: 11px; color: ${T.textDim}; letter-spacing: 0.12em; font-variant-numeric: tabular-nums; }

  .ac-main     { display: flex; flex-direction: column; flex: 1; overflow: hidden; padding: 12px; gap: 12px; }
  .ac-top-row  { flex: 1; min-height: 0; display: flex; gap: 12px; }
  .ac-bottom-row { display: flex; gap: 12px; height: 44%; flex-shrink: 0; }
  .ac-bottom-row > * { flex: 1; min-width: 0; }
  .ac-terminal-wrap  { flex: 1; min-width: 0; }
  .ac-history-wrap   { width: 260px; flex-shrink: 0; }

  .ac-panel {
    display: flex; flex-direction: column; height: 100%;
    border: 1px solid ${T.border}; border-radius: 2px; overflow: hidden;
  }
  .ac-panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 16px; border-bottom: 1px solid ${T.border};
    background: ${T.bgHeader}; flex-shrink: 0;
  }
  .ac-panel-title { font-size: 10px; letter-spacing: 0.18em; color: ${T.textDim}; text-transform: uppercase; }

  /* Terminal */
  .ac-terminal-scroll {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    padding: 12px 16px; background: ${T.bgPanel};
    scrollbar-width: thin; scrollbar-color: #334155 transparent;
  }
  .ac-streaming-badge { display: flex; align-items: center; gap: 6px; font-size: 10px; color: ${T.green}; letter-spacing: 0.12em; text-transform: uppercase; }
  .ac-streaming-dot   { width: 6px; height: 6px; border-radius: 50%; background: ${T.green}; animation: ac-pulse 1.5s infinite; }
  .ac-replay-badge    { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #3b82f6; letter-spacing: 0.12em; text-transform: uppercase; }
  .ac-poll-label      { margin-left: 6px; color: ${T.textFaint}; font-size: 10px; }
  @keyframes ac-pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }

  .ac-log-line { font-size: 11px; line-height: 1.7; white-space: pre-wrap; word-break: break-all; }
  .ac-log-ts   { color: #4b5563; user-select: none; margin-right: 8px; }
  .ac-log-sev  { font-size: 9px; color: #4b5563; user-select: none; margin-right: 8px; text-transform: uppercase; letter-spacing: 0.08em; }
  .ac-sev-INFO           { color: #c9d1d9; }
  .ac-sev-WARNING        { color: #f59e0b; }
  .ac-sev-COLLISION_RISK { color: #ef4444; }
  .ac-sev-ML_PREDICTION  { color: #06b6d4; }

  /* Upload */
  .ac-dropzone {
    border: 2px dashed ${T.borderHi}; border-radius: 2px; height: 100px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 6px; cursor: pointer; transition: border-color 0.15s, background 0.15s; user-select: none;
  }
  .ac-dropzone:hover { border-color: ${T.blue}; background: rgba(59,130,246,0.06); }
  .ac-dropzone-icon { font-size: 22px; color: ${T.textDim}; line-height: 1; }
  .ac-dropzone-text { font-size: 11px; color: ${T.textDim}; }
  .ac-dropzone-hint { font-size: 10px; color: ${T.textFaint}; }
  .ac-upload-body   { display: flex; flex-direction: column; gap: 10px; padding: 14px; flex: 1; background: ${T.bgPanel}; overflow-y: auto; }
  .ac-file-row      { display: flex; justify-content: space-between; font-size: 11px; color: ${T.textDim}; margin-bottom: 4px; }
  .ac-file-name     { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%; }
  .ac-file-size     { color: ${T.textFaint}; flex-shrink: 0; margin-left: 8px; }
  .ac-progress-track { width: 100%; height: 3px; background: ${T.borderHi}; border-radius: 99px; overflow: hidden; margin-top: 4px; }
  .ac-progress-fill  { height: 100%; border-radius: 99px; transition: width 0.2s; }
  .ac-progress-pct   { display: flex; justify-content: space-between; font-size: 10px; color: ${T.textFaint}; margin-top: 2px; }
  .ac-status-ok  { font-size: 11px; color: ${T.green}; }
  .ac-status-err { font-size: 11px; color: #ef4444; }
  .ac-upload-hint { margin-top: auto; font-size: 10px; color: ${T.textFaint}; }
  .ac-btn-reset  {
    font-size: 10px; color: ${T.textDim}; background: none; border: none;
    cursor: pointer; font-family: ${T.mono}; letter-spacing: 0.1em; text-transform: uppercase;
  }
  .ac-btn-reset:hover { color: ${T.text}; }

  /* Metrics */
  .ac-metrics-body { display: flex; flex-direction: column; gap: 12px; padding: 14px; flex: 1; overflow-y: auto; background: ${T.bgPanel}; }
  .ac-metric-label { font-size: 9px; color: ${T.textFaint}; letter-spacing: 0.14em; text-transform: uppercase; }
  .ac-metric-value { font-size: 20px; font-weight: 600; }
  .ac-metric-unit  { font-size: 11px; color: ${T.textDim}; }
  .ac-metric-sub   { font-size: 10px; color: ${T.textFaint}; margin-top: 2px; }
  .ac-no-data      { font-size: 11px; color: ${T.textFaint}; }

  /* Mission selector */
  .ac-mission-wrap  { display: flex; align-items: center; gap: 8px; }
  .ac-mission-label { font-size: 10px; color: ${T.textDim}; letter-spacing: 0.15em; text-transform: uppercase; }
  .ac-mission-select {
    background: #1e2733; border: 1px solid ${T.borderHi}; color: ${T.text};
    font-size: 11px; font-family: ${T.mono}; padding: 5px 10px;
    border-radius: 2px; cursor: pointer; outline: none; transition: border-color 0.15s;
  }
  .ac-mission-select:hover { border-color: #4b5563; }
  .ac-mission-select:focus { border-color: ${T.blue}; }

  /* User badge + logout */
  .ac-user-badge {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 10px; border: 1px solid ${T.border}; border-radius: 2px;
    background: ${T.bgHeader};
  }
  .ac-user-name   { font-size: 10px; color: ${T.textDim}; letter-spacing: 0.08em; }
  .ac-logout-btn  {
    font-size: 10px; color: #ef4444; background: none; border: none;
    cursor: pointer; font-family: ${T.mono}; letter-spacing: 0.1em; text-transform: uppercase;
  }
  .ac-logout-btn:hover { color: #fca5a5; }

  /* History toggle */
  .ac-history-btn {
    font-size: 10px; color: ${T.textDim}; background: ${T.bgHeader};
    border: 1px solid ${T.border}; border-radius: 2px;
    padding: 4px 10px; cursor: pointer; font-family: ${T.mono};
    letter-spacing: 0.1em; text-transform: uppercase; transition: border-color 0.15s;
  }
  .ac-history-btn:hover { border-color: ${T.blue}; color: ${T.text}; }
  .ac-history-btn.active { border-color: ${T.blue}; color: ${T.blue}; }

  /* Replay overlay banner */
  .ac-replay-banner {
    padding: 4px 16px; background: rgba(59,130,246,0.1);
    border-bottom: 1px solid rgba(59,130,246,0.2);
    font-size: 10px; color: #3b82f6; letter-spacing: 0.1em;
    flex-shrink: 0;
  }

  /* Scrollbars */
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

function useConsoleStyles() {
  useEffect(() => {
    const id = 'astral-console-styles';
    if (document.getElementById(id)) return;
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = GLOBAL_CSS;
    document.head.appendChild(tag);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

/* ─────────────────────────────────────────────────────────────────────────────
   System clock (isolated — never causes parent re-render)
───────────────────────────────────────────────────────────────────────────── */
function SystemClock() {
  const [time, setTime] = React.useState(() => utcNow());
  useEffect(() => {
    const id = setInterval(() => setTime(utcNow()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="ac-sysclock">{time} UTC</span>;
}
function utcNow() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Console Layout (authenticated view)
───────────────────────────────────────────────────────────────────────────── */
function ConsoleView() {
  useMissionAPI(); // starts polling

  const terminalRef    = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const { user, logout }              = useAuthStore();
  const { clearMetrics }              = useTelemetryStore();
  const { clear: clearHistory }       = useHistoryStore();
  const { clear: clearMissions }      = useMissionStore();
  const { selectedEntry }             = useHistoryStore();

  const handleMissionChange = useCallback(() => {
    terminalRef.current?.clearBuffer();
    clearMetrics();
  }, [clearMetrics]);

  const handleLogout = useCallback(async () => {
    // Clear terminal before any async work
    terminalRef.current?.clearBuffer();
    clearMetrics();
    clearHistory();
    clearMissions();
    await logout();
  }, [logout, clearMetrics, clearHistory, clearMissions]);

  // Replay logs into terminal from history entry
  const handleReplay = useCallback((logs) => {
    if (!logs) {
      // null = return to live feed
      terminalRef.current?.clearBuffer();
      window.dispatchEvent(new CustomEvent('astral:log', {
        detail: { timestamp: new Date().toISOString(), message: 'Returned to live feed.', severity: 'INFO' },
      }));
      return;
    }
    terminalRef.current?.clearBuffer();
    logs.forEach(log => {
      window.dispatchEvent(new CustomEvent('astral:log', { detail: log }));
    });
  }, []);

  // Listen for logout event (e.g. session expiry)
  useEffect(() => {
    const handler = () => {
      terminalRef.current?.clearBuffer();
      clearMetrics(); clearHistory(); clearMissions();
    };
    window.addEventListener('astral:logout', handler);
    return () => window.removeEventListener('astral:logout', handler);
  }, [clearMetrics, clearHistory, clearMissions]);

  return (
    <div className="astral-console">
      {/* ── Top bar ── */}
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

          {/* History toggle */}
          <button
            className={`ac-history-btn${showHistory ? ' active' : ''}`}
            onClick={() => setShowHistory(v => !v)}
          >
            ☰ History
          </button>

          {/* User badge */}
          <div className="ac-user-badge">
            <span className="ac-user-name">
              {user?.name ?? user?.email ?? 'Operator'}
            </span>
            <button className="ac-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <SystemClock />
        </div>
      </header>

      {/* ── Main grid ── */}
      <main className="ac-main">
        {/* Top half: terminal + optional history sidebar */}
        <div className="ac-top-row">
          <div className="ac-terminal-wrap">
            <TerminalWindow ref={terminalRef} isReplay={!!selectedEntry} />
          </div>
          {showHistory && (
            <div className="ac-history-wrap">
              <HistoryPanel
                onReplay={handleReplay}
                onClose={() => setShowHistory(false)}
              />
            </div>
          )}
        </div>

        {/* Bottom half: upload + data blocks */}
        <div className="ac-bottom-row">
          <FileUploadPanel />
          <DataBlocksPanel />
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Root — handles session restore + auth gate
───────────────────────────────────────────────────────────────────────────── */
export function AstralConsoleLayout() {
  useConsoleStyles();

  const { status, restoreSession } = useAuthStore();

  // Try to restore session from httpOnly cookie on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Show nothing while checking session (avoids login flash for valid sessions)
  if (status === 'loading' || status === 'idle') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#080b10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Courier New', Consolas, monospace",
        fontSize: 11, color: '#374151', letterSpacing: '0.15em',
      }}>
        INITIALISING…
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <LoginScreen />;
  }

  return <ConsoleView />;
}
