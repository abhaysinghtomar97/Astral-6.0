import React, { useImperativeHandle, forwardRef } from 'react';
import { TerminalHeader } from './TerminalHeader';
import { TerminalBody } from './TerminalBody';
import { useTerminalBuffer } from './useTerminalBuffer';

/**
 * TerminalWindow
 *
 * Composes TerminalHeader + TerminalBody.
 * Exposes `clearBuffer` via imperative handle so the parent (AstralConsole)
 * can wipe the log on mission switch without prop drilling.
 */
export const TerminalWindow = forwardRef(function TerminalWindow(_props, ref) {
  const { containerRef, clearBuffer } = useTerminalBuffer();

  // Expose `clearBuffer` to parent
  useImperativeHandle(ref, () => ({ clearBuffer }), [clearBuffer]);

  return (
    <div className="flex flex-col h-full border border-slate-700 rounded-sm overflow-hidden">
      <TerminalHeader />
      <TerminalBody ref={containerRef} />
    </div>
  );
});
