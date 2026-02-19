import { useCallback, useRef } from 'react';
import { useMissionStore } from '../store/missionStore';
import { useTelemetryStore } from '../store/telemetryStore';
import { usePolling } from './usePolling';

// ─────────────────────────────────────────────────────────────────────────────
// SET THIS TO false ONCE YOUR REAL BACKEND IS READY
// While true, the console runs on simulated data — no backend needed.
// ─────────────────────────────────────────────────────────────────────────────
const USE_MOCK = true;

const MOCK_LOGS = [
  ['Telemetry nominal. All subsystems green.', 'INFO'],
  ['Orbital propagation updated — epoch 2026-02-19T14:32:00Z', 'INFO'],
  ['SGP4 integration step: 0.5s. TLE age: 2.1 days.', 'INFO'],
  ['Cross-track maneuver delta-v budget recalculated.', 'INFO'],
  ['Ground station handoff: Madrid DSN → Goldstone DSN', 'INFO'],
  ['Battery state-of-charge: 78.2%. Solar array current nominal.', 'INFO'],
  ['Debris object 2019-006B entering conjunction window.', 'WARNING'],
  ['COLLISION_RISK assessment threshold crossed: 0.70', 'WARNING'],
  ['Predicted closest approach in 12 minutes at 1.4 km separation.', 'COLLISION_RISK'],
  ['ML ensemble prediction: collision_risk=0.82 confidence=0.91', 'ML_PREDICTION'],
  ['Attitude control: quaternion lock achieved. Pointing error < 0.01°', 'INFO'],
  ['Radar track updated. Range rate: -0.34 km/s', 'INFO'],
];

function generateMockPayload(missionId) {
  const [log, severity] = MOCK_LOGS[Math.floor(Math.random() * MOCK_LOGS.length)];
  return {
    timestamp: new Date().toISOString(),
    missionId,
    log,
    severity,
    metrics: {
      distance_km:    parseFloat((0.5 + Math.random() * 8).toFixed(2)),
      collision_risk: parseFloat((0.2 + Math.random() * 0.7).toFixed(3)),
      ml_confidence:  parseFloat((0.6 + Math.random() * 0.38).toFixed(3)),
      tca_minutes:    parseFloat((2 + Math.random() * 25).toFixed(1)),
    },
  };
}

const API_BASE = import.meta.env.VITE_ASTRAL_API ?? 'https://api.example.com/astral';

export function useMissionAPI() {
  const { activeMission } = useMissionStore();
  const { setMetrics, setLastUpdated } = useTelemetryStore();

  const lastTimestampRef = useRef(null);

  const poll = useCallback(async () => {
    if (!activeMission) return;

    try {
      let data;

      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 80)); // simulate latency
        data = generateMockPayload(activeMission);
      } else {
        const res = await fetch(
          `${API_BASE}/missions/${activeMission}/telemetry/latest`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      }

      // --- De-dupe: skip if we've already processed this timestamp ---
      if (data.timestamp === lastTimestampRef.current) return;
      lastTimestampRef.current = data.timestamp;

      // --- Push log entry to terminal via custom event (no React state) ---
      window.dispatchEvent(
        new CustomEvent('astral:log', {
          detail: {
            timestamp: data.timestamp,
            message: data.log,
            severity: data.severity ?? 'INFO',
          },
        })
      );

      // --- Update metric store (small object, triggers targeted renders) ---
      if (data.metrics) {
        setMetrics({
          missionId: data.missionId,
          distanceKm: data.metrics.distance_km,
          collisionRisk: data.metrics.collision_risk,
          mlConfidence: data.metrics.ml_confidence,
          tca: data.metrics.tca_minutes ?? null,
        });
        setLastUpdated(data.timestamp);
      }
    } catch (err) {
      // Surface connectivity failures to the terminal
      if (err.name !== 'AbortError') {
        window.dispatchEvent(
          new CustomEvent('astral:log', {
            detail: {
              timestamp: new Date().toISOString(),
              message: `[API ERROR] ${err.message}`,
              severity: 'WARNING',
            },
          })
        );
      }
    }
  }, [activeMission, setMetrics, setLastUpdated]);

  usePolling(poll, 2000, !!activeMission);
}
