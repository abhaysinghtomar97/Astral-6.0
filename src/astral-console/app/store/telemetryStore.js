import { create } from 'zustand';

/**
 * telemetryStore
 *
 * Holds the latest metrics snapshot from the backend.
 * Terminal logs go directly to the DOM — never stored here.
 * This store is the single source of truth for DataBlocksPanel.
 */
export const useTelemetryStore = create((set) => ({
  metrics:     null,
  lastUpdated: null,
  isReplay:    false,   // true when replaying a history entry

  setMetrics:     (metrics) => set({ metrics, isReplay: false }),
  setLastUpdated: (ts)      => set({ lastUpdated: ts }),
  replayMetrics:  (metrics) => set({ metrics, isReplay: true, lastUpdated: new Date().toISOString() }),

  // Clear on mission switch or logout
  clearMetrics: () => set({ metrics: null, lastUpdated: null, isReplay: false }),
}));
