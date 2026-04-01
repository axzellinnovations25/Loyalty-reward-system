import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth';
import './login.css';

export default function LoginPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // In this project, the raw data is returned or wrapped. 
      // Based on authApi structure: authApi.login returns Promise<AxiosResponse<LoginResponse>> via our client.
      // But let's assume it returns the LoginResponse directly if we use our common wrapper.
      const res = await authApi.login({ username, password });
      
      // Axios interceptors or our client usually handle the nesting. 
      // Based on previous patterns, we might need res.data or just res.
      // Checking useService/apiClient patterns usually helps but let's stick to the res = result logic.
      setAuth(res.user, res.token);
      
      // Navigate to dashboard after successful login
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      const message = err.response?.data?.error || err.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sl-root">
      <div className="sl-orb sl-orb--1" />
      <div className="sl-orb sl-orb--2" />

      <div className="sl-card">
        {/* Brand */}
        <div className="sl-brand">
          <div className="sl-logo">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M11 2L20 7v8L11 20 2 15V7L11 2z" fill="currentColor" />
              <path d="M7 11l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="sl-brand-name">LoyaltyOS</span>
        </div>

        {/* Header */}
        <div className="sl-header">
          <h1 className="sl-title">Staff Login</h1>
          <p className="sl-subtitle">Manage your rewards and customers</p>
        </div>

        {/* Form */}
        <form className="sl-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="sl-error" role="alert">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7.5 4.5v3.5M7.5 10v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <div className="sl-field">
            <label className="sl-label" htmlFor="username">Username or Email</label>
            <div className="sl-input-wrap">
              <svg className="sl-input-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path d="M7.5 7.5a3 3 0 100-6 3 3 0 000 6zM2.5 13.5a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                id="username"
                className="sl-input"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="sl-field">
            <label className="sl-label" htmlFor="password">Password</label>
            <div className="sl-input-wrap">
              <svg className="sl-input-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <rect x="2.5" y="6.5" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5 6.5V4.5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="7.5" cy="10" r="1" fill="currentColor" />
              </svg>
              <input
                id="password"
                className="sl-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="sl-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8C2.5 5 5 3.5 8 3.5s5.5 1.5 7 4.5c-1.5 3-4 4.5-7 4.5S2.5 11 1 8z" stroke="currentColor" strokeWidth="1.3"/>
                    <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8C2.5 5 5 3.5 8 3.5s5.5 1.5 7 4.5c-1.5 3-4 4.5-7 4.5S2.5 11 1 8z" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            className="sl-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="sl-spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Sign in to Dashboard'
            )}
          </button>
        </form>

        <div className="sl-divider">
          <div className="sl-divider-line" />
          <span className="sl-divider-text">SHOP PORTAL</span>
          <div className="sl-divider-line" />
        </div>

        <p className="sl-footer-note">
          Trouble signing in? <a href="mailto:support@loyaltyos.com" className="sl-footer-link">Contact Support</a>
        </p>
      </div>
    </div>
  );
}
