import { useCallback, useRef } from 'react';
import { useMissionStore } from '../store/missionStore';
import { useTelemetryStore } from '../store/telemetryStore';
import { usePolling } from './usePolling';

const API_BASE = import.meta.env.VITE_ASTRAL_API ?? 'https://api.example.com/astral';

/**
 * useMissionAPI
 * Wires together polling + store updates for the active mission.
 * Terminal events are dispatched via a custom DOM event so the
 * TerminalBody can append directly to the DOM — no React state.
 */
export function useMissionAPI() {
  const { activeMission } = useMissionStore();
  const { setMetrics, setLastUpdated } = useTelemetryStore();

  // Track the last event timestamp to avoid re-processing duplicates.
  const lastTimestampRef = useRef(null);

  const poll = useCallback(async () => {
    if (!activeMission) return;

    try {
      const res = await fetch(
        `${API_BASE}/missions/${activeMission}/telemetry/latest`,
        { signal: AbortSignal.timeout(4000) } // don't let a slow call stack up
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

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
