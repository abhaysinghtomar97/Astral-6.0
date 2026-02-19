import { useEffect, useRef, useCallback } from 'react';

const MAX_LINES = 2000;

const SEVERITY_CLASS = {
  INFO:           'ac-sev-INFO',
  WARNING:        'ac-sev-WARNING',
  COLLISION_RISK: 'ac-sev-COLLISION_RISK',
  ML_PREDICTION:  'ac-sev-ML_PREDICTION',
};

export function useTerminalBuffer() {
  const containerRef = useRef(null);

  const appendLine = useCallback(({ timestamp, message, severity }) => {
    const el = containerRef.current;
    if (!el) return;

    const ts = new Date(timestamp).toISOString().replace('T', ' ').slice(0, 23);
    const sevClass = SEVERITY_CLASS[severity] ?? SEVERITY_CLASS.INFO;

    const line = document.createElement('div');
    line.className = `ac-log-line ${sevClass}`;
    line.innerHTML =
      `<span class="ac-log-ts">${ts}</span>` +
      `<span class="ac-log-sev">[${severity}]</span>` +
      `<span>${escapeHtml(message)}</span>`;

    el.appendChild(line);

    while (el.childElementCount > MAX_LINES) {
      el.removeChild(el.firstChild);
    }

    // Auto-scroll if near bottom
    const parent = el.parentElement;
    if (parent) {
      const nearBottom = parent.scrollHeight - parent.scrollTop - parent.clientHeight < 80;
      if (nearBottom) parent.scrollTop = parent.scrollHeight;
    }
  }, []);

  const clearBuffer = useCallback(() => {
    if (containerRef.current) containerRef.current.innerHTML = '';
  }, []);

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
