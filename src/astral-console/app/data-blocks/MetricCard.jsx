import React, { memo } from 'react';

/**
 * MetricCard — memoized to prevent re-render unless its specific value changes.
 *
 * @param {string}  label       — displayed label
 * @param {string}  value       — formatted value string
 * @param {string}  [unit]      — optional unit suffix
 * @param {'ok'|'warn'|'crit'|'info'} [status] — drives the accent colour
 * @param {string}  [sub]       — optional sub-label (e.g. "updated 3s ago")
 */
export const MetricCard = memo(function MetricCard({ label, value, unit, status = 'info', sub }) {
  const accentClass = {
    ok:   'border-green-700  text-green-400',
    warn: 'border-yellow-600 text-yellow-400',
    crit: 'border-red-700    text-red-400',
    info: 'border-slate-600  text-slate-300',
  }[status];

  const dotClass = {
    ok:   'bg-green-400',
    warn: 'bg-yellow-400',
    crit: 'bg-red-500 animate-pulse',
    info: 'bg-slate-500',
  }[status];

  return (
    <div className={`border-l-2 ${accentClass} pl-3 py-1 bg-slate-900/60`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-mono font-semibold ${accentClass.split(' ')[1]}`}>
          {value ?? '—'}
        </span>
        {unit && (
          <span className="text-xs font-mono text-slate-500">{unit}</span>
        )}
      </div>
      {sub && (
        <div className="text-[10px] font-mono text-slate-600 mt-0.5">{sub}</div>
      )}
    </div>
  );
});
