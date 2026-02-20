import React, { useState, useRef, useCallback } from 'react';
import { useAuthStore }    from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { useHistoryStore } from '../store/historyStore';

const API_BASE   = import.meta.env.VITE_ASTRAL_API ?? 'https://api.example.com/astral';
const ALLOWED    = ['.csv', '.json', '.tle', '.txt', '.dat'];
const MAX_MB     = 200;

// ── DropZone ─────────────────────────────────────────────────────────────────
function DropZone({ onFile, disabled }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => {
        e.preventDefault(); setDrag(false);
        if (!disabled) { const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }
      }}
      onKeyDown={e => e.key === 'Enter' && !disabled && inputRef.current?.click()}
      tabIndex={0} role="button"
      className="ac-dropzone"
      style={drag ? { borderColor: '#3b82f6', background: 'rgba(59,130,246,0.06)' } : {}}
    >
      <div className="ac-dropzone-icon">↑</div>
      <div className="ac-dropzone-text">{drag ? 'Release to upload' : 'Drop file or click to browse'}</div>
      <div className="ac-dropzone-hint">{ALLOWED.join(' ')} — max {MAX_MB} MB</div>
      <input
        ref={inputRef} type="file" style={{ display: 'none' }}
        accept={ALLOWED.join(',')}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ── FileUploadPanel ───────────────────────────────────────────────────────────
export function FileUploadPanel() {
  const { user, getAuthHeader } = useAuthStore();
  const { activeMission }       = useMissionStore();
  const { fetchHistory }        = useHistoryStore();

  const [state, setState] = useState({
    file: null, progress: 0, status: 'idle', error: null, result: null,
  });

  const upload = useCallback(async (file) => {
    // Validate type
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setState({ file, progress: 0, status: 'error', error: `"${ext}" not accepted.`, result: null });
      return;
    }
    // Validate size
    if (file.size > MAX_MB * 1024 * 1024) {
      setState({ file, progress: 0, status: 'error', error: `Exceeds ${MAX_MB} MB limit.`, result: null });
      return;
    }
    if (!user) {
      setState({ file, progress: 0, status: 'error', error: 'Not authenticated.', result: null });
      return;
    }

    setState({ file, progress: 0, status: 'uploading', error: null, result: null });

    // Dispatch upload-start log
    window.dispatchEvent(new CustomEvent('astral:log', {
      detail: { timestamp: new Date().toISOString(), message: `Upload started: ${file.name}`, severity: 'INFO' },
    }));

    await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const fd  = new FormData();
      fd.append('file',      file);
      fd.append('userId',    user.id);
      fd.append('missionId', activeMission);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setState(s => ({ ...s, progress: Math.round((e.loaded / e.total) * 100) }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText || '{}');
          setState(s => ({ ...s, progress: 100, status: 'done', result }));

          // Log success & ML response to terminal
          window.dispatchEvent(new CustomEvent('astral:log', {
            detail: { timestamp: new Date().toISOString(), message: `Upload complete: ${file.name}`, severity: 'INFO' },
          }));
          if (result.prediction) {
            window.dispatchEvent(new CustomEvent('astral:log', {
              detail: {
                timestamp: new Date().toISOString(),
                message:   `ML prediction received — risk: ${(result.prediction.collision_risk * 100).toFixed(1)}%`,
                severity:  'ML_PREDICTION',
              },
            }));
          }

          // Refresh history after successful upload
          fetchHistory(getAuthHeader(), activeMission);
        } else {
          const msg = `Upload failed: HTTP ${xhr.status}`;
          setState(s => ({ ...s, status: 'error', error: msg, result: null }));
          window.dispatchEvent(new CustomEvent('astral:log', {
            detail: { timestamp: new Date().toISOString(), message: msg, severity: 'WARNING' },
          }));
        }
        resolve();
      });

      xhr.addEventListener('error', () => {
        const msg = 'Network error during upload.';
        setState(s => ({ ...s, status: 'error', error: msg, result: null }));
        resolve();
      });

      xhr.open('POST', `${API_BASE}/missions/${activeMission}/upload`);
      // Set auth header (token-based; httpOnly cookie is sent automatically via credentials)
      const authH = getAuthHeader();
      if (authH.Authorization) xhr.setRequestHeader('Authorization', authH.Authorization);
      xhr.send(fd);
    });
  }, [user, activeMission, getAuthHeader, fetchHistory]);

  const reset = () => setState({ file: null, progress: 0, status: 'idle', error: null, result: null });
  const retry = () => { if (state.file) upload(state.file); };

  const { file, progress, status, error, result } = state;
  const isUploading = status === 'uploading';
  const isDone      = status === 'done';
  const isError     = status === 'error';

  return (
    <div className="ac-panel">
      <div className="ac-panel-header">
        <span className="ac-panel-title">Data Ingestion</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {isError && (
            <button className="ac-btn-reset" onClick={retry}>↺ Retry</button>
          )}
          {(isDone || isError) && (
            <button className="ac-btn-reset" onClick={reset}>Reset</button>
          )}
        </div>
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

        {isDone && (
          <div className="ac-status-ok">
            ✓ File delivered to mission pipeline.
            {result?.runId && (
              <div style={{ marginTop: 4, fontSize: 10, color: '#4b5563' }}>Run ID: {result.runId}</div>
            )}
          </div>
        )}
        {isError && <div className="ac-status-err">✗ {error}</div>}

        {status === 'idle' && !file && (
          <div className="ac-upload-hint">
            Telemetry continues uninterrupted during upload.
            {user && (
              <div style={{ marginTop: 4, color: '#374151' }}>Operator: {user.name ?? user.email}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
