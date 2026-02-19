import React, { forwardRef } from 'react';

/**
 * TerminalBody
 *
 * Thin wrapper around the scrollable log container.
 * The actual log lines are appended directly to the DOM by useTerminalBuffer —
 * this component owns zero state of its own, keeping React out of the hot path.
 *
 * `containerRef` is forwarded from TerminalWindow so the hook can reach the DOM node.
 */
export const TerminalBody = forwardRef(function TerminalBody(_props, containerRef) {
  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 bg-[#0a0d12]"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
    >
      {/* Log lines are injected here by useTerminalBuffer DOM appends */}
      <div ref={containerRef} />

      {/* Spacer so the last line never sits right at the edge */}
      <div className="h-4" />
    </div>
  );
});
