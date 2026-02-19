import React, { useCallback } from 'react';
import { useMissionStore } from './store/missionStore';
import { useTelemetryStore } from './store/telemetryStore';

/**
 * MissionSelector
 *
 * Dropdown that switches the active mission.
 * On switch:
 *   1. Clears stale telemetry metrics
 *   2. Fires `onMissionChange` so AstralConsole can wipe the terminal buffer
 *   3. Updates the active mission in the store (triggers API re-target)
 */
export function MissionSelector({ onMissionChange }) {
  const { activeMission, missions, setActiveMission } = useMissionStore();
  const { clearMetrics } = useTelemetryStore();

  const handleChange = useCallback(
    (e) => {
      const id = e.target.value;
      if (id === activeMission) return;

      clearMetrics();
      onMissionChange?.();    // let parent clear terminal
      setActiveMission(id);
    },
    [activeMission, clearMetrics, onMissionChange, setActiveMission]
  );

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest shrink-0">
        Mission
      </span>
      <select
        value={activeMission}
        onChange={handleChange}
        className={[
          'bg-slate-800 border border-slate-600 text-slate-200',
          'text-xs font-mono px-3 py-1.5 rounded-sm',
          'focus:outline-none focus:border-blue-500',
          'hover:border-slate-500 transition-colors',
          'cursor-pointer',
        ].join(' ')}
      >
        {missions.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
