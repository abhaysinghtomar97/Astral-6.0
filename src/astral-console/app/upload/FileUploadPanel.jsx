import React from 'react';
import { DropZone } from './DropZone';
import { useFileUpload } from './useFileUpload';

const STATUS_LABEL = {
  idle: null,
  validating: 'Validating…',
  uploading: null, // shown via progress bar
  done: 'Upload complete',
  error: null, // shown via error state
};

/**
 * FileUploadPanel
 * Left panel of the bottom row.
 * Upload runs independently of the polling loop — they share no state.
 */
export function FileUploadPanel() {
  const { uploadState, upload, reset } = useFileUpload();
  const { file, progress, status, error } = uploadState;

  const isUploading = status === 'uploading';
  const isDone = status === 'done';
  const isError = status === 'error';

  return (
    <div className="flex flex-col h-full border border-slate-700 rounded-sm overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-900 shrink-0">
        <span className="text-slate-400 text-xs font-mono tracking-widest uppercase">
          Data Ingestion
        </span>
        {(isDone || isError) && (
          <button
            onClick={reset}
            className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4 flex-1 bg-[#0a0d12]">
        <DropZone onFile={upload} disabled={isUploading} />

        {/* Active file info */}
        {file && (
          <div className="font-mono text-xs">
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="truncate max-w-[70%]">{file.name}</span>
              <span className="text-slate-500 shrink-0 ml-2">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>

            {/* Progress bar */}
            {(isUploading || isDone) && (
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${isDone ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {isUploading && (
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
            )}
          </div>
        )}

        {/* Status messages */}
        {isDone && (
          <p className="text-xs font-mono text-green-400">✓ File delivered to mission pipeline.</p>
        )}
        {isError && (
          <p className="text-xs font-mono text-red-400">✗ {error}</p>
        )}
        {STATUS_LABEL[status] && !isDone && !isError && (
          <p className="text-xs font-mono text-slate-400">{STATUS_LABEL[status]}</p>
        )}

        {/* Accepted types reminder when idle */}
        {status === 'idle' && !file && (
          <div className="mt-auto">
            <p className="text-[10px] font-mono text-slate-600">
              Telemetry continues uninterrupted during upload.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
