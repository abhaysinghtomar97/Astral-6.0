import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_ASTRAL_API ?? 'https://api.example.com/astral';

/**
 * authStore
 *
 * Token is kept in memory only (never localStorage/sessionStorage).
 * The backend should use httpOnly cookies for the real token; this store
 * tracks the *session state* so the UI knows who is logged in.
 *
 * On page refresh the user will need to re-authenticate — this is intentional
 * for an operational console where stale sessions are a security risk.
 */
export const useAuthStore = create((set, get) => ({
  user:    null,   // { id, name, email, role }
  token:   null,   // in-memory only — never written to localStorage
  status:  'idle', // idle | loading | authenticated | error
  error:   null,

  // ── Login ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ status: 'loading', error: null });
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method:      'POST',
        credentials: 'include',           // send/receive httpOnly cookies
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Login failed: HTTP ${res.status}`);
      }
      const data = await res.json();
      // Backend returns { token, user: { id, name, email, role } }
      set({ token: data.token, user: data.user, status: 'authenticated', error: null });
      return { ok: true };
    } catch (err) {
      set({ status: 'error', error: err.message });
      return { ok: false, error: err.message };
    }
  },

  // ── Restore session (call on app mount) ───────────────────────────────────
  restoreSession: async () => {
    set({ status: 'loading' });
    try {
      const res = await fetch(`${API_BASE}/me`, {
        credentials: 'include',
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error('No active session');
      const data = await res.json();
      set({ user: data.user, token: data.token ?? null, status: 'authenticated' });
    } catch {
      set({ user: null, token: null, status: 'idle' });
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
    } catch { /* best-effort */ }
    // Wipe everything from memory
    set({ user: null, token: null, status: 'idle', error: null });
    // Clear sensitive data signal — other stores listen for this
    window.dispatchEvent(new CustomEvent('astral:logout'));
  },

  // ── Helpers ────────────────────────────────────────────────────────────────
  isAuthenticated: () => get().status === 'authenticated' && get().user !== null,
  getAuthHeader:   () => get().token ? { Authorization: `Bearer ${get().token}` } : {},
}));
