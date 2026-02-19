import React, { useState, useRef, useCallback } from 'react';

/**
 * DropZone
 * Handles both drag-and-drop and click-to-browse file selection.
 * Delegates actual upload to the parent via `onFile`.
 */
export function DropZone({ onFile, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [disabled, onFile]
  );

  const handleChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [onFile]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop file here or click to browse"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      className={[
        'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-sm',
        'h-28 cursor-pointer select-none transition-colors duration-150',
        isDragging
          ? 'border-blue-500 bg-blue-950/30'
          : 'border-slate-600 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60',
        disabled ? 'opacity-40 pointer-events-none' : '',
      ].join(' ')}
    >
      <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <span className="text-xs text-slate-400 font-mono">
        {isDragging ? 'Release to upload' : 'Drop file or click to browse'}
      </span>
      <span className="text-[10px] text-slate-600 font-mono">.csv .json .tle .txt .dat — max 200 MB</span>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".csv,.json,.tle,.txt,.dat"
        onChange={handleChange}
      />
    </div>
  );
}
