import React, { useState, useEffect, memo } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';

// ── MetricCard ────────────────────────────────────────────────────────────────
const MetricCard = memo(function MetricCard({ label, value, unit, status = 'info', sub }) {
  const colors = {
    info: { border: '#374151', value: '#c9d1d9', dot: '#c9d1d9' },
    ok:   { border: '#15803d', value: '#22c55e', dot: '#22c55e' },
    warn: { border: '#92400e', value: '#f59e0b', dot: '#f59e0b' },
    crit: { border: '#991b1b', value: '#ef4444', dot: '#ef4444' },
  }[status] ?? { border: '#374151', value: '#c9d1d9', dot: '#c9d1d9' };

  return (
    <div style={{ borderLeft: `2px solid ${colors.border}`, padding: '4px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', background: colors.dot, flexShrink: 0,
          animation: status === 'crit' ? 'ac-pulse 1s infinite' : 'none',
        }} />
        <span className="ac-metric-label">{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="ac-metric-value" style={{ color: colors.value }}>{value ?? '—'}</span>
        {unit && <span className="ac-metric-unit">{unit}</span>}
      </div>
      {sub && <div className="ac-metric-sub">{sub}</div>}
    </div>
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const riskStatus = (r) => r == null ? 'info' : r >= 0.7 ? 'crit' : r >= 0.4 ? 'warn' : 'ok';
const distStatus = (d) => d == null ? 'info' : d < 1    ? 'crit' : d < 5    ? 'warn' : 'ok';
const confStatus = (c) => c == null ? 'info' : c >= 0.85 ? 'ok'  : c >= 0.6 ? 'warn' : 'crit';
const fmtPct = (v) => v != null ? (v * 100).toFixed(1) + '%' : null;
const fmtKm  = (v) => v != null ? v.toFixed(2) : null;
const fmtTca = (v) => {
  if (v == null) return null;
  const m = Math.floor(v), s = Math.round((v - m) * 60);
  return `${m}m ${s}s`;
};

// ── DataBlocksPanel ───────────────────────────────────────────────────────────
export function DataBlocksPanel() {
  const { metrics, lastUpdated, isReplay } = useTelemetryStore();
  const [secAgo, setSecAgo] = useState(null);

  useEffect(() => {
    if (!lastUpdated) return;
    const id = setInterval(() => {
      setSecAgo(Math.round((Date.now() - new Date(lastUpdated).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  return (
    <div className="ac-panel">
      <div className="ac-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ac-panel-title">Derived Intelligence</span>
          {isReplay && (
            <span style={{
              fontSize: 9, color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 2, padding: '1px 5px', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Replay
            </span>
          )}
        </div>
        {secAgo != null && (
          <span style={{ fontSize: 10, color: '#4b5563' }}>updated {secAgo}s ago</span>
        )}
      </div>

      <div className="ac-metrics-body">
        {!metrics ? (
          <div className="ac-no-data">Awaiting telemetry…</div>
        ) : (
          <>
            <MetricCard
              label="Mission ID"
              value={metrics.missionId}
              status="info"
            />
            <MetricCard
              label="Collision Probability"
              value={fmtPct(metrics.collisionRisk)}
              status={riskStatus(metrics.collisionRisk)}
              sub={metrics.collisionRisk >= 0.7 ? '⚠ MANEUVER WINDOW ACTIVE' : null}
            />
            <MetricCard
              label="Min Distance"
              value={fmtKm(metrics.distanceKm)}
              unit="km"
              status={distStatus(metrics.distanceKm)}
            />
            <MetricCard
              label="Time to Closest Approach"
              value={fmtTca(metrics.tca)}
              status={metrics.tca != null && metrics.tca < 10 ? 'crit' : 'info'}
            />
            <MetricCard
              label="ML Confidence Score"
              value={fmtPct(metrics.mlConfidence)}
              status={confStatus(metrics.mlConfidence)}
            />
          </>
        )}
      </div>
    </div>
  );
}
