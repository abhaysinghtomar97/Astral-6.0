import { create } from 'zustand';

/**
 * telemetryStore — holds the *latest* derived metrics from the API.
 *
 * Terminal logs are intentionally NOT stored here; they go straight to the DOM
 * via useRef in TerminalBody to support hours-long sessions without memory
 * accumulation or React reconciliation overhead.
 */
export const useTelemetryStore = create((set) => ({
  metrics: null,
  lastUpdated: null,

  setMetrics: (metrics) => set({ metrics }),
  setLastUpdated: (ts) => set({ lastUpdated: ts }),

  /** Called when the active mission changes — wipe stale data immediately. */
  clearMetrics: () => set({ metrics: null, lastUpdated: null }),
}));
