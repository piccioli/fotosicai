import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../lib/api.js';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await adminApi.login(username, password);
      localStorage.setItem('fotosicai_admin_token', token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Errore di login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <img src="/logo-sicai.png" alt="SICAI" className="admin-login-logo" />
        <h1 className="admin-login-title">FotoSICAI Admin</h1>
        {error && <div className="admin-alert admin-alert--error">{error}</div>}
        <label className="admin-field">
          <span>Username</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="admin-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={loading}>
          {loading ? 'Accesso…' : 'Accedi'}
        </button>
      </form>
    </div>
  );
}
