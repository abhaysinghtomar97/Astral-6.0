import React, { useImperativeHandle, forwardRef } from 'react';
import { useTerminalBuffer } from './useTerminalBuffer';
import { useMissionStore } from '../store/missionStore';

export const TerminalWindow = forwardRef(function TerminalWindow(_, ref) {
  const { containerRef, clearBuffer } = useTerminalBuffer();
  const { activeMission } = useMissionStore();

  useImperativeHandle(ref, () => ({ clearBuffer }), [clearBuffer]);

  return (
    <div className="ac-panel">
      {/* Header */}
      <div className="ac-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#374151' }} />
            ))}
          </div>
          <span className="ac-panel-title">{activeMission} — Event Stream</span>
        </div>
        <div className="ac-streaming-badge">
          <span className="ac-streaming-dot" />
          Streaming
          <span className="ac-poll-label">2s poll</span>
        </div>
      </div>

      {/* Scrollable log body */}
      <div
        className="ac-terminal-scroll"
        ref={(el) => {
          // expose scroll container to buffer hook via data attr
          if (el) el._scrollContainer = true;
        }}
        id="ac-scroll-container"
      >
        <div ref={containerRef} />
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
});
