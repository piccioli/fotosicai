import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api.js';

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.users().then(setUsers).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="admin-alert admin-alert--error">{error}</div>;
  if (!users) return <div className="admin-loading">Caricamento utenti…</div>;

  return (
    <div>
      <h2 className="admin-page-title">Utenti ({users.length})</h2>
      {users.length === 0
        ? <p className="admin-empty">Nessun autore registrato.</p>
        : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nome autore</th>
                  <th>Foto</th>
                  <th>Email verificata</th>
                  <th>Ultima upload</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email}>
                    <td><a href={`mailto:${u.email}`}>{u.email}</a></td>
                    <td>{u.autore_nome || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{u.photo_count}</td>
                    <td style={{ textAlign: 'center' }}>
                      {u.verified
                        ? <span className="admin-badge admin-badge--ok">Sì</span>
                        : <span className="admin-badge admin-badge--warn">No</span>}
                    </td>
                    <td>{fmt(u.last_upload_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
