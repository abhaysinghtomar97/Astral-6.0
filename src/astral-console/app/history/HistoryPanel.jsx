import React, { useEffect, useCallback, memo } from 'react';
import { useHistoryStore } from '../store/historyStore';
import { useAuthStore }    from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { useTelemetryStore } from '../store/telemetryStore';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtTs(ts) {
  return new Date(ts).toISOString().replace('T', ' ').slice(0, 19);
}
function fmtRisk(v) { return v != null ? (v * 100).toFixed(1) + '%' : '—'; }

const STATUS_COLOR = {
  complete: '#22c55e',
  failed:   '#ef4444',
  running:  '#f59e0b',
};

// ── Single history entry row ──────────────────────────────────────────────────
const HistoryEntry = memo(function HistoryEntry({ entry, isSelected, onSelect }) {
  const color = STATUS_COLOR[entry.status] ?? '#6b7280';

  return (
    <div
      onClick={() => onSelect(entry)}
      style={{
        padding: '8px 12px',
        borderLeft: `2px solid ${isSelected ? '#3b82f6' : 'transparent'}`,
        background: isSelected ? 'rgba(59,130,246,0.06)' : 'transparent',
        cursor: 'pointer',
        transition: 'background 0.1s, border-color 0.1s',
        borderBottom: '1px solid #1a2030',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: '#c9d1d9', fontWeight: 600 }}>
          {entry.filename ?? entry.type.toUpperCase()}
        </span>
        <span style={{ fontSize: 9, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ● {entry.status}
        </span>
      </div>
      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: '#4b5563' }}>{fmtTs(entry.timestamp)}</span>
        {entry.metrics && (
          <span style={{ fontSize: 9, color: entry.metrics.collision_risk >= 0.7 ? '#ef4444' : '#6b7280' }}>
            risk {fmtRisk(entry.metrics.collision_risk)}
          </span>
        )}
      </div>
    </div>
  );
});

// ── History Panel ─────────────────────────────────────────────────────────────
export function HistoryPanel({ onReplay, onClose }) {
  const { entries, selectedEntry, loading, error, fetchHistory, selectEntry, clearSelection } = useHistoryStore();
  const { getAuthHeader } = useAuthStore();
  const { activeMission } = useMissionStore();
  const { replayMetrics } = useTelemetryStore();

  // Fetch history whenever mission changes
  useEffect(() => {
    fetchHistory(getAuthHeader(), activeMission);
  }, [activeMission, getAuthHeader, fetchHistory]);

  const handleSelect = useCallback((entry) => {
    selectEntry(entry);

    // Replay metrics into DataBlocksPanel immediately
    if (entry.metrics) {
      replayMetrics({
        missionId:     entry.missionId,
        distanceKm:    entry.metrics.distance_km,
        collisionRisk: entry.metrics.collision_risk,
        mlConfidence:  entry.metrics.ml_confidence,
        tca:           entry.metrics.tca_minutes ?? null,
      });
    }

    // Replay logs into terminal
    if (entry.logs?.length) {
      onReplay?.(entry.logs);
    }
  }, [selectEntry, replayMetrics, onReplay]);

  const handleClear = useCallback(() => {
    clearSelection();
    onReplay?.(null); // signal to terminal to go back to live feed
  }, [clearSelection, onReplay]);

  // Filter to active mission
  const filtered = activeMission
    ? entries.filter(e => e.missionId === activeMission)
    : entries;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: '#0a0d12',
      border: '1px solid #1e2733', borderRadius: 2, overflow: 'hidden',
      fontFamily: "'Courier New', Consolas, monospace",
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 12px', borderBottom: '1px solid #1e2733', background: '#0e1218',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, color: '#6b7280', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Run History
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {selectedEntry && (
            <button onClick={handleClear} style={btnStyle('#374151')}>
              ← Live
            </button>
          )}
          <button onClick={onClose} style={btnStyle('#374151')}>✕</button>
        </div>
      </div>

      {/* Refresh button */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #1a2030', flexShrink: 0 }}>
        <button
          onClick={() => fetchHistory(getAuthHeader(), activeMission)}
          disabled={loading}
          style={{ ...btnStyle('#1d4ed8'), width: '100%', padding: '5px' }}
        >
          {loading ? 'Fetching…' : '↻ Refresh'}
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
        {error && (
          <div style={{ padding: 12, fontSize: 11, color: '#ef4444' }}>⚠ {error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: 16, fontSize: 11, color: '#374151', textAlign: 'center' }}>
            No history for this mission.
          </div>
        )}
        {filtered.map(entry => (
          <HistoryEntry
            key={entry.id}
            entry={entry}
            isSelected={selectedEntry?.id === entry.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Replay indicator */}
      {selectedEntry && (
        <div style={{
          padding: '6px 12px', borderTop: '1px solid #1e2733',
          background: 'rgba(59,130,246,0.08)', flexShrink: 0,
          fontSize: 10, color: '#3b82f6', letterSpacing: '0.1em',
        }}>
          ▶ REPLAYING — {selectedEntry.filename ?? selectedEntry.id}
        </div>
      )}
    </div>
  );
}

function btnStyle(bg) {
  return {
    background: bg, border: 'none', borderRadius: 2,
    color: '#c9d1d9', fontFamily: "'Courier New', Consolas, monospace",
    fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '4px 8px', cursor: 'pointer',
  };
}
