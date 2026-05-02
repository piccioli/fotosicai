import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { adminApi } from '../../lib/api.js';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    adminApi.me()
      .then(() => setChecked(true))
      .catch(() => {
        localStorage.removeItem('fotosicai_admin_token');
        navigate('/admin/login', { replace: true });
      });
  }, [navigate]);

  function logout() {
    localStorage.removeItem('fotosicai_admin_token');
    navigate('/admin/login', { replace: true });
  }

  if (!checked) return <div className="admin-loading">Caricamento…</div>;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <img src="/logo-sicai.png" alt="SICAI" style={{ height: 32 }} />
          <span>Admin</span>
        </div>
        <nav className="admin-sidebar__nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            Utenti
          </NavLink>
          <NavLink to="/admin/foto" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            Foto
          </NavLink>
        </nav>
        <a href="/" className="admin-logout-btn" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>← Mappa</a>
        <button className="admin-logout-btn" onClick={logout}>Esci</button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
