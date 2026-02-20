import React, { useEffect, useCallback } from 'react';
import { useMissionStore }   from './store/missionStore';
import { useTelemetryStore } from './store/telemetryStore';
import { useAuthStore }      from './store/authStore';

export function MissionSelector({ onMissionChange }) {
  const { activeMission, missions, fetchMissions, setActiveMission, loading } = useMissionStore();
  const { clearMetrics }   = useTelemetryStore();
  const { getAuthHeader }  = useAuthStore();

  // Fetch user's missions on mount
  useEffect(() => {
    fetchMissions(getAuthHeader());
  }, [fetchMissions, getAuthHeader]);

  const handleChange = useCallback((e) => {
    const id = e.target.value;
    if (id === activeMission) return;
    clearMetrics();
    onMissionChange?.();
    setActiveMission(id);
  }, [activeMission, clearMetrics, onMissionChange, setActiveMission]);

  return (
    <div className="ac-mission-wrap">
      <span className="ac-mission-label">Mission</span>
      <select
        className="ac-mission-select"
        value={activeMission ?? ''}
        onChange={handleChange}
        disabled={loading || missions.length === 0}
      >
        {loading && <option value="">Loading…</option>}
        {!loading && missions.length === 0 && <option value="">No missions</option>}
        {missions.map(m => (
          <option key={m.id} value={m.id}>{m.label ?? m.name ?? m.id}</option>
        ))}
      </select>
    </div>
  );
}
