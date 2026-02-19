import { useEffect, useRef, useCallback } from 'react';

/**
 * usePolling — fire a callback on a fixed interval, with clean teardown.
 * Interval resets automatically when `intervalMs` or `enabled` changes.
 *
 * @param {() => void} callback   — called every `intervalMs` ms
 * @param {number}     intervalMs — polling cadence (default 2000)
 * @param {boolean}    enabled    — pause/resume without unmounting
 */
export function usePolling(callback, intervalMs = 2000, enabled = true) {
  // Keep a stable ref to the latest callback so we don't restart
  // the timer just because an inline function was recreated.
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => callbackRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
