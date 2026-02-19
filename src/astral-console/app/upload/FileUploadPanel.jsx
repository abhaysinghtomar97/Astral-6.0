import React, { useState, useRef, useCallback } from 'react';
import { useMissionStore } from '../store/missionStore';

// ── DropZone ────────────────────────────────────────────────────────────────
function DropZone({ onFile, disabled }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div
      className={`ac-dropzone${drag ? ' drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      tabIndex={0}
      role="button"
      onKeyDown={e => e.key === 'Enter' && !disabled && inputRef.current?.click()}
    >
      <div className="ac-dropzone-icon">↑</div>
      <div className="ac-dropzone-text">
        {drag ? 'Release to upload' : 'Drop file or click to browse'}
      </div>
      <div className="ac-dropzone-hint">.csv .json .tle .txt .dat — max 200 MB</div>
      <input
        ref={inputRef} type="file"
        accept=".csv,.json,.tle,.txt,.dat"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ── FileUploadPanel ──────────────────────────────────────────────────────────
const ALLOWED  = ['.csv', '.json', '.tle', '.txt', '.dat'];
const MAX_MB   = 200;
const API_BASE = import.meta.env.VITE_ASTRAL_API ?? 'https://api.example.com/astral';

export function FileUploadPanel() {
  const { activeMission } = useMissionStore();
  const [state, setState] = useState({ file: null, progress: 0, status: 'idle', error: null });

  const upload = useCallback(async (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setState({ file, progress: 0, status: 'error', error: `"${ext}" not allowed. Use: ${ALLOWED.join(', ')}` });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setState({ file, progress: 0, status: 'error', error: `File exceeds ${MAX_MB} MB limit.` });
      return;
    }

    setState({ file, progress: 0, status: 'uploading', error: null });

    // XHR for real upload progress
    await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const fd  = new FormData();
      fd.append('file', file);
      fd.append('missionId', activeMission);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setState(s => ({ ...s, progress: Math.round((e.loaded / e.total) * 100) }));
        }
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setState(s => ({ ...s, progress: 100, status: 'done' }));
        } else {
          setState(s => ({ ...s, status: 'error', error: `Upload failed: HTTP ${xhr.status}` }));
        }
        resolve();
      });
      xhr.addEventListener('error', () => {
        setState(s => ({ ...s, status: 'error', error: 'Network error during upload.' }));
        resolve();
      });
      xhr.open('POST', `${API_BASE}/missions/${activeMission}/upload`);
      xhr.send(fd);
    });
  }, [activeMission]);

  const reset = () => setState({ file: null, progress: 0, status: 'idle', error: null });

  const { file, progress, status, error } = state;
  const isUploading = status === 'uploading';
  const isDone      = status === 'done';
  const isError     = status === 'error';

  return (
    <div className="ac-panel">
      <div className="ac-panel-header">
        <span className="ac-panel-title">Data Ingestion</span>
        {(isDone || isError) && (
          <button className="ac-btn-reset" onClick={reset}>Reset</button>
        )}
      </div>

      <div className="ac-upload-body">
        <DropZone onFile={upload} disabled={isUploading} />

        {file && (
          <div>
            <div className="ac-file-row">
              <span className="ac-file-name" title={file.name}>{file.name}</span>
              <span className="ac-file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            {(isUploading || isDone) && (
              <>
                <div className="ac-progress-track">
                  <div
                    className="ac-progress-fill"
                    style={{ width: `${progress}%`, background: isDone ? '#22c55e' : '#3b82f6' }}
                  />
                </div>
                <div className="ac-progress-pct">
                  <span>{isUploading ? 'Uploading…' : 'Complete'}</span>
                  <span>{progress}%</span>
                </div>
              </>
            )}
          </div>
        )}

        {isDone  && <div className="ac-status-ok">✓ File delivered to mission pipeline.</div>}
        {isError && <div className="ac-status-err">✗ {error}</div>}
        {status === 'idle' && !file && (
          <div className="ac-upload-hint">Telemetry continues uninterrupted during upload.</div>
        )}
      </div>
    </div>
  );
}
