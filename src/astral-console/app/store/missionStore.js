import { create } from 'zustand';

/**
 * missionStore — tracks which mission is active + the mission catalogue.
 *
 * Keeping this tiny keeps re-renders surgical:
 *   - MissionSelector re-renders on `missions` change
 *   - Everything that cares about the active mission subscribes to `activeMission`
 */
export const useMissionStore = create((set) => ({
  activeMission: 'ASTRAL-M1',

  missions: [
    { id: 'ASTRAL-M1', label: 'ASTRAL-M1 — LEO Survey' },
    { id: 'ASTRAL-M2', label: 'ASTRAL-M2 — GEO Transfer' },
    { id: 'ASTRAL-M3', label: 'ASTRAL-M3 — Polar Monitor' },
    { id: 'ASTRAL-M4', label: 'ASTRAL-M4 — Deep Recon' },
  ],

  /**
   * Switch to a different mission.
   * Callers are responsible for clearing the terminal buffer before calling.
   */
  setActiveMission: (id) => set({ activeMission: id }),
}));
