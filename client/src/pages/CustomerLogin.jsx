import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginScene3D from '../components/LoginScene3D';
import './CustomerLogin.css';

export default function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8787/api/auth/mock-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      login(data.token, data.user);
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cl-root">
      {/* Full-screen 3D Background */}
      <div className="cl-canvas-bg">
        <LoginScene3D />
      </div>

      <button className="cl-back-btn" onClick={() => navigate('/')}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back
      </button>

      {/* Centered card */}
      <div className="cl-card">
        {/* Google-style icon */}
        <div className="cl-icon-ring">
          <svg viewBox="0 0 48 48" width="36" height="36">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 46c5.5 0 10.5-1.9 14.4-5l-6.7-5.5C29.7 37 27 38 24 38c-6 0-11-4-12.7-9.5l-7 5.4C7.9 41.5 15.4 46 24 46z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.8 2.5-2.4 4.6-4.5 6l6.7 5.5C42.6 36.5 45 30.8 45 24c0-1.3-.2-2.7-.5-4z"/>
          </svg>
        </div>

        <h1 className="cl-title">Welcome back</h1>
        <p className="cl-subtitle">Sign in with your Google account to get support</p>

        {error && <div className="cl-error">{error}</div>}

        <form onSubmit={handleLogin} className="cl-form">
          <div className="cl-field">
            <svg className="cl-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <input
              id="customer-email"
              type="email"
              placeholder="Enter your Gmail address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <button id="customer-login-btn" type="submit" className="cl-btn" disabled={loading}>
            {loading ? (
              <span className="cl-spinner" />
            ) : (
              <>
                <svg viewBox="0 0 48 48" width="20" height="20" style={{ flexShrink: 0 }}>
                  <path fill="#fff" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" opacity="0.9"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </form>

        <p className="cl-hint">✦ Demo mode — any email works for testing</p>
      </div>
    </div>
  );
}
