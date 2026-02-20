import React, { useImperativeHandle, forwardRef } from 'react';
import { useTerminalBuffer } from './useTerminalBuffer';
import { useMissionStore }   from '../store/missionStore';

/**
 * TerminalWindow
 * Accepts `isReplay` prop to show the correct badge (STREAMING vs REPLAY).
 */
export const TerminalWindow = forwardRef(function TerminalWindow({ isReplay }, ref) {
  const { containerRef, clearBuffer } = useTerminalBuffer();
  const { activeMission } = useMissionStore();

  useImperativeHandle(ref, () => ({ clearBuffer }), [clearBuffer]);

  return (
    <div className="ac-panel">
      {/* Header */}
      <div className="ac-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#374151' }} />
            ))}
          </div>
          <span className="ac-panel-title">
            {activeMission ?? '—'} — Event Stream
          </span>
        </div>

        {/* Badge: live streaming vs history replay */}
        {isReplay ? (
          <div className="ac-replay-badge">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            Replay
          </div>
        ) : (
          <div className="ac-streaming-badge">
            <span className="ac-streaming-dot" />
            Streaming
            <span className="ac-poll-label">2s poll</span>
          </div>
        )}
      </div>

      {/* Log body */}
      <div className="ac-terminal-scroll">
        <div ref={containerRef} />
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
});
