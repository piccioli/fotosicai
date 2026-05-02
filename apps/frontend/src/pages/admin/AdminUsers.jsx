import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/api.js';

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('it-IT', { dateStyle: 'short' });
}

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    adminApi.users().then(setUsers).catch((e) => setError(e.message));
  }, []);

  async function handleExport() {
    setDownloading(true);
    try {
      await adminApi.exportUsers();
    } catch (e) {
      alert(`Errore durante l'export: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  }

  if (error) return <div className="admin-alert admin-alert--error">{error}</div>;
  if (!users) return <div className="admin-loading">Caricamento utenti…</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <h2 className="admin-page-title" style={{ margin: 0 }}>Utenti ({users.length})</h2>
        <button className="admin-btn admin-btn--success" onClick={handleExport} disabled={downloading}>
          {downloading ? '…' : '⬇ Scarica XLS'}
        </button>
      </div>
      {users.length === 0
        ? <p className="admin-empty">Nessun autore registrato.</p>
        : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nome autore</th>
                  <th>Socio CAI</th>
                  <th>Sezione</th>
                  <th>Ruolo</th>
                  <th>Referente SICAI</th>
                  <th>Tappa / Regione</th>
                  <th>Foto</th>
                  <th>Email verif.</th>
                  <th>Data verifica</th>
                  <th>Consenso</th>
                  <th>Ricontatto</th>
                  <th>Ultima upload</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email}>
                    <td><a href={`mailto:${u.email}`}>{u.email}</a></td>
                    <td>{u.autore_nome || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {u.socio_cai
                        ? <span className="admin-badge admin-badge--ok">Sì</span>
                        : <span className="admin-badge admin-badge--neutral">No</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>{u.sezione_cai || '—'}</td>
                    <td style={{ fontSize: 12 }}>{u.ruolo_cai || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {u.referente_sicai
                        ? <span className="admin-badge admin-badge--ok">Sì</span>
                        : <span className="admin-badge admin-badge--neutral">No</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>{u.referente_sicai_ambito || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{u.photo_count}</td>
                    <td style={{ textAlign: 'center' }}>
                      {u.verified
                        ? <span className="admin-badge admin-badge--ok">Sì</span>
                        : <span className="admin-badge admin-badge--warn">No</span>}
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(u.verified_at)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {u.consenso
                        ? <span className="admin-badge admin-badge--ok">Sì</span>
                        : <span className="admin-badge admin-badge--neutral">No</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {u.marketing_consent
                        ? <span className="admin-badge admin-badge--ok">Sì</span>
                        : <span className="admin-badge admin-badge--neutral">No</span>}
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
