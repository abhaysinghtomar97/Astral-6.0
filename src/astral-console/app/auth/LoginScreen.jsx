import React, { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: '#080b10',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Courier New', Consolas, monospace",
    zIndex: 9999,
  },
  card: {
    width: 380,
    border: '1px solid #1e2733',
    borderRadius: 2,
    overflow: 'hidden',
    background: '#0a0d12',
  },
  header: {
    padding: '14px 20px',
    borderBottom: '1px solid #1e2733',
    background: '#0e1218',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  dot: { width: 7, height: 7, borderRadius: '50%', background: '#3b82f6' },
  title: { fontSize: 11, letterSpacing: '0.2em', color: '#e2e8f0', textTransform: 'uppercase' },
  body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
  label: { fontSize: 10, color: '#6b7280', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, display: 'block' },
  input: {
    width: '100%', background: '#080b10',
    border: '1px solid #2d3a4a', borderRadius: 2,
    color: '#c9d1d9', fontFamily: 'inherit', fontSize: 12,
    padding: '8px 10px', outline: 'none',
    transition: 'border-color 0.15s',
  },
  btn: {
    width: '100%', padding: '10px',
    background: '#1d4ed8', border: 'none', borderRadius: 2,
    color: '#e2e8f0', fontFamily: 'inherit', fontSize: 11,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    cursor: 'pointer', transition: 'background 0.15s',
    marginTop: 4,
  },
  btnLoading: { background: '#1e3a6e', cursor: 'not-allowed' },
  error: {
    fontSize: 11, color: '#ef4444',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 2, padding: '8px 10px',
  },
  sub: { fontSize: 10, color: '#374151', textAlign: 'center', marginTop: 4 },
};

export function LoginScreen() {
  const { login, status, error } = useAuthStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [focused,  setFocused]  = useState(null);

  const isLoading = status === 'loading';

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    await login(email.trim(), password);
  }, [email, password, login]);

  const inputStyle = (field) => ({
    ...S.input,
    borderColor: focused === field ? '#3b82f6' : '#2d3a4a',
  });

  return (
    <div style={S.overlay}>
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="2.5" fill="#3b82f6" />
          <circle cx="9" cy="9" r="7"   stroke="#3b82f6" strokeWidth="1"   opacity="0.4" />
          <circle cx="9" cy="9" r="4.5" stroke="#3b82f6" strokeWidth="0.5" opacity="0.25" />
        </svg>
        <span style={{ fontSize: 14, letterSpacing: '0.22em', color: '#e2e8f0', textTransform: 'uppercase', fontFamily: 'inherit', fontWeight: 600 }}>
          Astral
        </span>
        <span style={{ fontSize: 10, color: '#4b5563', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Mission Console
        </span>
      </div>

      <div style={S.card}>
        <div style={S.header}>
          <div style={S.dot} />
          <span style={S.title}>Operator Authentication</span>
        </div>

        <form style={S.body} onSubmit={handleSubmit}>
          {error && <div style={S.error}>⚠ {error}</div>}

          <div>
            <label style={S.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              style={inputStyle('email')}
              placeholder="operator@agency.gov"
              autoComplete="email"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label style={S.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              style={inputStyle('password')}
              placeholder="••••••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            style={isLoading ? { ...S.btn, ...S.btnLoading } : S.btn}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating…' : 'Access Console'}
          </button>
        </form>
      </div>

      <p style={S.sub}>Authorised personnel only. All sessions are logged.</p>
    </div>
  );
}
