import React, { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_ASTRAL_API ?? 'https://api.example.com/astral';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position: 'fixed', inset: 0, background: '#080b10',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Courier New', Consolas, monospace", zIndex: 9999,
  },
  wordmarkWrap: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28,
  },
  wordmarkName: {
    fontSize: 13, fontWeight: 600, letterSpacing: '0.2em',
    color: '#e2e8f0', textTransform: 'uppercase',
  },
  wordmarkSub: {
    fontSize: 10, color: '#4b5563', letterSpacing: '0.15em', textTransform: 'uppercase',
  },
  card: {
    width: 400, border: '1px solid #1e2733',
    borderRadius: 2, overflow: 'hidden', background: '#0a0d12',
  },
  // Tab bar
  tabBar: {
    display: 'flex', borderBottom: '1px solid #1e2733',
  },
  tab: (active) => ({
    flex: 1, padding: '10px 0', fontSize: 10,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    background: active ? '#0a0d12' : '#080b10',
    color: active ? '#c9d1d9' : '#4b5563',
    border: 'none', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'color 0.15s',
  }),
  body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 14 },
  label: {
    fontSize: 10, color: '#6b7280', letterSpacing: '0.12em',
    textTransform: 'uppercase', marginBottom: 4, display: 'block',
  },
  input: (focused) => ({
    width: '100%', background: '#080b10',
    border: `1px solid ${focused ? '#3b82f6' : '#2d3a4a'}`,
    borderRadius: 2, color: '#c9d1d9',
    fontFamily: "'Courier New', Consolas, monospace",
    fontSize: 12, padding: '8px 10px', outline: 'none',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  }),
  btn: (loading) => ({
    width: '100%', padding: '10px',
    background: loading ? '#1e3a6e' : '#1d4ed8',
    border: 'none', borderRadius: 2,
    color: '#e2e8f0', fontFamily: 'inherit', fontSize: 11,
    letterSpacing: '0.15em', textTransform: 'uppercase',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s', marginTop: 4,
  }),
  error: {
    fontSize: 11, color: '#ef4444',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 2, padding: '8px 10px',
  },
  success: {
    fontSize: 11, color: '#22c55e',
    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 2, padding: '8px 10px',
  },
  footer: {
    fontSize: 10, color: '#374151', textAlign: 'center',
    marginTop: 16, letterSpacing: '0.05em',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable input field
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, disabled, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={S.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={S.input(focused)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        required
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Login tab
// ─────────────────────────────────────────────────────────────────────────────
function LoginForm() {
  const { login } = useAuthStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
    if (!result.ok) setError(result.error ?? 'Login failed');
    setLoading(false);
  }, [email, password, login]);

  return (
    <form style={S.body} onSubmit={handleSubmit}>
      {error && <div style={S.error}>⚠ {error}</div>}
      <Field label="Email"    type="email"    value={email}    onChange={setEmail}    placeholder="operator@agency.gov" disabled={loading} autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••••••"         disabled={loading} autoComplete="current-password" />
      <button type="submit" style={S.btn(loading)} disabled={loading}>
        {loading ? 'Authenticating…' : 'Access Console'}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Register tab
// ─────────────────────────────────────────────────────────────────────────────
function RegisterForm() {
  const { setUserFromRegister } = useAuthStore();  // ← add this
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/register`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail ?? 'Registration failed');
        setLoading(false);
        return;
      }

      setUserFromRegister(data.token, data.user);  // ← direct call, no dynamic import

    } catch (err) {
      setError('Network error — is the backend running?');
      setLoading(false);
    }
  }, [name, email, password, confirm, setUserFromRegister]);

  return (
    <form style={S.body} onSubmit={handleSubmit}>
      {error && <div style={S.error}>⚠ {error}</div>}
      <Field label="Full Name"       type="text"     value={name}     onChange={setName}     placeholder="Mission Operator"      disabled={loading} autoComplete="name" />
      <Field label="Email"           type="email"    value={email}    onChange={setEmail}    placeholder="operator@agency.gov"   disabled={loading} autoComplete="email" />
      <Field label="Password"        type="password" value={password} onChange={setPassword} placeholder="min 6 characters"      disabled={loading} autoComplete="new-password" />
      <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="repeat password"        disabled={loading} autoComplete="new-password" />
      <button type="submit" style={S.btn(loading)} disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LoginScreen root
// ─────────────────────────────────────────────────────────────────────────────
export function LoginScreen() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  return (
    <div style={S.overlay}>
      {/* Wordmark */}
      <div style={S.wordmarkWrap}>
        <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="2.5" fill="#3b82f6" />
          <circle cx="9" cy="9" r="7"   stroke="#3b82f6" strokeWidth="1"   opacity="0.4" />
          <circle cx="9" cy="9" r="4.5" stroke="#3b82f6" strokeWidth="0.5" opacity="0.25" />
        </svg>
        <span style={S.wordmarkName}>Astral</span>
        <span style={S.wordmarkSub}>Mission Console</span>
      </div>

      {/* Card */}
      <div style={S.card}>
        {/* Tab bar */}
        <div style={S.tabBar}>
          <button style={S.tab(tab === 'login')}    onClick={() => setTab('login')}>
            Login
          </button>
          <button style={S.tab(tab === 'register')} onClick={() => setTab('register')}>
            Register
          </button>
        </div>

        {/* Form */}
        {tab === 'login'    && <LoginForm />}
        {tab === 'register' && <RegisterForm />}
      </div>

      <p style={S.footer}>Authorised personnel only. All sessions are logged.</p>
    </div>
  );
}