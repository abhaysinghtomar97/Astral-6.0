import React, { useCallback } from 'react';
import { useMissionStore } from './store/missionStore';
import { useTelemetryStore } from './store/telemetryStore';

export function MissionSelector({ onMissionChange }) {
  const { activeMission, missions, setActiveMission } = useMissionStore();
  const { clearMetrics } = useTelemetryStore();

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
      <select className="ac-mission-select" value={activeMission} onChange={handleChange}>
        {missions.map(m => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
