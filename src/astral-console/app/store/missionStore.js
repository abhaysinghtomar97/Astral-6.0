import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_ASTRAL_API ?? 'https://api.example.com/astral';

/**
 * missionStore
 *
 * Missions are user-scoped — fetched from the backend after login.
 * MissionSelector only shows missions belonging to the logged-in user.
 */
export const useMissionStore = create((set, get) => ({
  activeMission: null,
  missions:      [],
  loading:       false,
  error:         null,

  // ── Fetch user's missions from backend ─────────────────────────────────────
  fetchMissions: async (authHeader) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/missions`, {
        credentials: 'include',
        headers: { ...authHeader },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Missions fetch failed: HTTP ${res.status}`);
      const data = await res.json();
      const missions = data.missions ?? [];
      set({
        missions,
        activeMission: missions[0]?.id ?? null,
        loading: false,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  setActiveMission: (id) => set({ activeMission: id }),

  // ── Clear on logout ────────────────────────────────────────────────────────
  clear: () => set({ activeMission: null, missions: [], loading: false, error: null }),
}));
