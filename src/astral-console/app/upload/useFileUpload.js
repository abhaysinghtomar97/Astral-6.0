import { useState, useCallback } from 'react';
import { useMissionStore } from '../store/missionStore';

const API_BASE = import.meta.env.VITE_ASTRAL_API ?? 'https://api.example.com/astral';
const MAX_SIZE_MB = 200;
const ALLOWED_TYPES = ['.csv', '.json', '.tle', '.txt', '.dat'];

export function useFileUpload() {
  const { activeMission } = useMissionStore();
  const [uploadState, setUploadState] = useState({
    file: null,
    progress: 0,       // 0–100
    status: 'idle',    // idle | validating | uploading | done | error
    error: null,
  });

  const reset = useCallback(() => {
    setUploadState({ file: null, progress: 0, status: 'idle', error: null });
  }, []);

  const upload = useCallback(
    async (file) => {
      // --- Validation ---
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_TYPES.includes(ext)) {
        setUploadState((s) => ({
          ...s,
          file,
          status: 'error',
          error: `File type "${ext}" not accepted. Allowed: ${ALLOWED_TYPES.join(', ')}`,
        }));
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadState((s) => ({
          ...s,
          file,
          status: 'error',
          error: `File exceeds ${MAX_SIZE_MB} MB limit.`,
        }));
        return;
      }

      setUploadState({ file, progress: 0, status: 'uploading', error: null });

      // --- XHR for progress tracking (fetch doesn't expose upload progress) ---
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('missionId', activeMission);

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadState((s) => ({
              ...s,
              progress: Math.round((e.loaded / e.total) * 100),
            }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadState((s) => ({ ...s, progress: 100, status: 'done' }));
            resolve();
          } else {
            const msg = `Upload failed: HTTP ${xhr.status}`;
            setUploadState((s) => ({ ...s, status: 'error', error: msg }));
            reject(new Error(msg));
          }
        });

        xhr.addEventListener('error', () => {
          const msg = 'Network error during upload.';
          setUploadState((s) => ({ ...s, status: 'error', error: msg }));
          reject(new Error(msg));
        });

        xhr.open('POST', `${API_BASE}/missions/${activeMission}/upload`);
        xhr.send(formData);
      }).catch(() => {/* error state already set */});
    },
    [activeMission]
  );

  return { uploadState, upload, reset };
}
