import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_ASTRAL_API ?? 'https://api.example.com/astral';

/**
 * historyStore
 *
 * Frontend cache of per-user history fetched from the backend.
 * Backend is the source of truth — this store only holds what was last fetched.
 *
 * History entries shape (from backend):
 * {
 *   id:         "run-abc123",
 *   missionId:  "ASTRAL-M1",
 *   type:       "upload" | "prediction",
 *   filename:   "tle_2026_02.csv",       // uploads only
 *   timestamp:  "2026-02-19T14:32:10Z",
 *   status:     "complete" | "failed" | "running",
 *   metrics:    { distance_km, collision_risk, ml_confidence, tca_minutes },
 *   logs:       [ { timestamp, message, severity }, ... ]
 * }
 */
export const useHistoryStore = create((set, get) => ({
  entries:        [],       // all history for current user
  selectedEntry:  null,     // entry being replayed in terminal/datablocks
  loading:        false,
  error:          null,

  // ── Fetch history from backend ─────────────────────────────────────────────
  fetchHistory: async (authHeader, missionId = null) => {
    set({ loading: true, error: null });
    try {
      const url = missionId
        ? `${API_BASE}/history?missionId=${encodeURIComponent(missionId)}`
        : `${API_BASE}/history`;

      const res = await fetch(url, {
        credentials: 'include',
        headers: { ...authHeader },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`History fetch failed: HTTP ${res.status}`);
      const data = await res.json();
      set({ entries: data.entries ?? [], loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // ── Select a history entry for replay ─────────────────────────────────────
  selectEntry: (entry) => set({ selectedEntry: entry }),
  clearSelection: ()  => set({ selectedEntry: null }),

  // ── Clear on logout ────────────────────────────────────────────────────────
  clear: () => set({ entries: [], selectedEntry: null, loading: false, error: null }),
}));
