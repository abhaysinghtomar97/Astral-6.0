import React, { useMemo } from 'react';
import { MetricCard } from './MetricCard';
import { useTelemetryStore } from '../store/telemetryStore';

function riskStatus(risk) {
  if (risk == null) return 'info';
  if (risk >= 0.7) return 'crit';
  if (risk >= 0.4) return 'warn';
  return 'ok';
}

function distanceStatus(km) {
  if (km == null) return 'info';
  if (km < 1) return 'crit';
  if (km < 5) return 'warn';
  return 'ok';
}

function confidenceStatus(c) {
  if (c == null) return 'info';
  if (c >= 0.85) return 'ok';
  if (c >= 0.6) return 'warn';
  return 'crit';
}

function fmtPct(v) {
  return v != null ? (v * 100).toFixed(1) + '%' : null;
}

function fmtKm(v) {
  return v != null ? v.toFixed(2) : null;
}

function fmtTca(v) {
  if (v == null) return null;
  const m = Math.floor(v);
  const s = Math.round((v - m) * 60);
  return `${m}m ${s}s`;
}

/**
 * DataBlocksPanel
 * Right panel — shows derived intelligence from the latest telemetry snapshot.
 * Each MetricCard is memoized; this panel only re-renders when the store changes.
 */
export function DataBlocksPanel() {
  const { metrics, lastUpdated } = useTelemetryStore();

  const updatedLabel = useMemo(() => {
    if (!lastUpdated) return null;
    const diff = Math.round((Date.now() - new Date(lastUpdated).getTime()) / 1000);
    return `updated ${diff}s ago`;
  }, [lastUpdated]);

  return (
    <div className="flex flex-col h-full border border-slate-700 rounded-sm overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-900 shrink-0">
        <span className="text-slate-400 text-xs font-mono tracking-widest uppercase">
          Derived Intelligence
        </span>
        {updatedLabel && (
          <span className="text-[10px] font-mono text-slate-600">{updatedLabel}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#0a0d12]">
        {!metrics ? (
          <p className="text-xs font-mono text-slate-600 mt-2">Awaiting telemetry…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <MetricCard
              label="Mission ID"
              value={metrics.missionId}
              status="info"
            />
            <MetricCard
              label="Collision Probability"
              value={fmtPct(metrics.collisionRisk)}
              status={riskStatus(metrics.collisionRisk)}
              sub={metrics.collisionRisk >= 0.7 ? '⚠ MANEUVER WINDOW ACTIVE' : undefined}
            />
            <MetricCard
              label="Min Distance"
              value={fmtKm(metrics.distanceKm)}
              unit="km"
              status={distanceStatus(metrics.distanceKm)}
            />
            <MetricCard
              label="Time to Closest Approach"
              value={fmtTca(metrics.tca)}
              status={metrics.tca != null && metrics.tca < 10 ? 'crit' : 'info'}
            />
            <MetricCard
              label="ML Confidence Score"
              value={fmtPct(metrics.mlConfidence)}
              status={confidenceStatus(metrics.mlConfidence)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
