import { useEffect, useRef, useCallback } from 'react';

const MAX_LINES = 2000; // cap DOM nodes to prevent memory creep in long sessions

const SEVERITY_CLASS = {
  INFO: 'text-slate-200',
  WARNING: 'text-yellow-400',
  COLLISION_RISK: 'text-red-500',
  ML_PREDICTION: 'text-cyan-400',
};

/**
 * useTerminalBuffer
 *
 * Manages direct DOM manipulation for the terminal log stream.
 * Using refs + DOM appends (not React state) means:
 *   - Zero re-renders triggered by log activity
 *   - O(1) append cost regardless of log volume
 *   - Easy MAX_LINES eviction via firstChild removal
 *
 * @returns {{ containerRef, clearBuffer }}
 */
export function useTerminalBuffer() {
  const containerRef = useRef(null);

  const appendLine = useCallback(({ timestamp, message, severity }) => {
    const el = containerRef.current;
    if (!el) return;

    const ts = new Date(timestamp).toISOString().replace('T', ' ').slice(0, 23);
    const severityClass = SEVERITY_CLASS[severity] ?? SEVERITY_CLASS.INFO;

    const line = document.createElement('div');
    line.className = `font-mono text-xs leading-5 whitespace-pre-wrap break-all ${severityClass}`;
    line.innerHTML =
      `<span class="text-slate-500 select-none mr-2">${ts}</span>` +
      `<span class="text-slate-400 select-none mr-2 uppercase text-[10px]">[${severity}]</span>` +
      `<span>${escapeHtml(message)}</span>`;

    el.appendChild(line);

    // Trim oldest entries to stay under DOM node cap
    while (el.childElementCount > MAX_LINES) {
      el.removeChild(el.firstChild);
    }

    // Auto-scroll — only if user hasn't scrolled up
    const parent = el.parentElement;
    if (parent) {
      const isNearBottom =
        parent.scrollHeight - parent.scrollTop - parent.clientHeight < 80;
      if (isNearBottom) {
        parent.scrollTop = parent.scrollHeight;
      }
    }
  }, []);

  const clearBuffer = useCallback(() => {
    const el = containerRef.current;
    if (el) el.innerHTML = '';
  }, []);

  // Listen for log events dispatched by useMissionAPI
  useEffect(() => {
    const handler = (e) => appendLine(e.detail);
    window.addEventListener('astral:log', handler);
    return () => window.removeEventListener('astral:log', handler);
  }, [appendLine]);

  return { containerRef, clearBuffer };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
