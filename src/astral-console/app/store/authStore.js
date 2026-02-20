import { create } from 'zustand';

const API_BASE = import.meta.env.VITE_ASTRAL_API ?? 'https://api.example.com/astral';

export const useAuthStore = create((set, get) => ({
  user:   null,
  token:  null,
  status: 'idle',  // idle | loading | authenticated | unauthenticated | error
  error:  null,

  // ── Login ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ status: 'loading', error: null });
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `Login failed: HTTP ${res.status}`);
      }
      const data = await res.json();
      set({ token: data.token, user: data.user, status: 'authenticated', error: null });
      return { ok: true };
    } catch (err) {
      set({ status: 'error', error: err.message });
      return { ok: false, error: err.message };
    }
  },

  // ── Called after successful registration (auto-login) ─────────────────────
  setUserFromRegister: (token, user) => {
    set({ token, user, status: 'authenticated', error: null });
  },

  // ── Restore session on app mount ──────────────────────────────────────────
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
      // ← 'unauthenticated' (not 'idle') so AstralConsoleLayout shows LoginScreen
      set({ user: null, token: null, status: 'unauthenticated' });
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
    } catch { /* best-effort */ }
    set({ user: null, token: null, status: 'unauthenticated', error: null });
    window.dispatchEvent(new CustomEvent('astral:logout'));
  },

  // ── Helpers ────────────────────────────────────────────────────────────────
  isAuthenticated: () => get().status === 'authenticated' && get().user !== null,
  getAuthHeader:   () => get().token ? { Authorization: `Bearer ${get().token}` } : {},
}));