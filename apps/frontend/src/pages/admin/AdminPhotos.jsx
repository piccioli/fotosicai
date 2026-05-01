import React, { useEffect, useState, useCallback, useRef } from 'react';
import { adminApi } from '../../lib/api.js';

const STATUS_LABELS = {
  published: 'Pubblicata',
  pending_verification: 'In attesa',
  draft: 'Bozza',
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdminPhotos() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const debounceRef = useRef(null);

  const load = useCallback((s, query, p) => {
    setError('');
    adminApi.images({ status: s, q: query, page: p })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { load(status, q, page); }, [status, page]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleQChange(e) {
    const val = e.target.value;
    setQ(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(status, val, 1); }, 400);
  }

  function handleStatusChange(e) {
    setStatus(e.target.value);
    setPage(1);
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Eliminare la foto "${title || id}"? Questa azione è irreversibile.`)) return;
    setDeleting(id);
    try {
      await adminApi.deleteImage(id);
      load(status, q, page);
    } catch (e) {
      alert(`Errore: ${e.message}`);
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  return (
    <div>
      <h2 className="admin-page-title">Foto {data ? `(${data.total})` : ''}</h2>

      <div className="admin-filters">
        <select value={status} onChange={handleStatusChange} className="admin-select">
          <option value="all">Tutti gli stati</option>
          <option value="published">Pubblicate</option>
          <option value="pending_verification">In attesa di verifica</option>
          <option value="draft">Bozza</option>
        </select>
        <input
          type="search"
          placeholder="Cerca titolo, autore, email…"
          value={q}
          onChange={handleQChange}
          className="admin-search"
        />
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {!data
        ? <div className="admin-loading">Caricamento foto…</div>
        : data.items.length === 0
          ? <p className="admin-empty">Nessuna foto trovata.</p>
          : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Antepr.</th>
                      <th>Titolo</th>
                      <th>Autore</th>
                      <th>Email</th>
                      <th>Tappa</th>
                      <th>Regione</th>
                      <th>Stato</th>
                      <th>Data</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((img) => (
                      <tr key={img.id}>
                        <td>
                          {img.thumb_url
                            ? <img src={img.thumb_url} alt="" className="admin-thumb" />
                            : <div className="admin-thumb admin-thumb--empty" />}
                        </td>
                        <td>
                          {img.status === 'published'
                            ? <a href={`/foto/${img.id}`} target="_blank" rel="noopener noreferrer">{img.titolo || '—'}</a>
                            : (img.titolo || '—')}
                        </td>
                        <td>{img.autore_nome || '—'}</td>
                        <td style={{ fontSize: 12 }}>{img.email || '—'}</td>
                        <td>{img.stage_ref || '—'}</td>
                        <td>{img.regione || '—'}</td>
                        <td>
                          <span className={`admin-badge ${img.status === 'published' ? 'admin-badge--ok' : img.status === 'pending_verification' ? 'admin-badge--warn' : 'admin-badge--neutral'}`}>
                            {STATUS_LABELS[img.status] || img.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmt(img.created_at)}</td>
                        <td>
                          <button
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => handleDelete(img.id, img.titolo)}
                            disabled={deleting === img.id}
                          >
                            {deleting === img.id ? '…' : 'Elimina'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="admin-pagination">
                  <button className="admin-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prec.</button>
                  <span>Pag. {page} / {totalPages}</span>
                  <button className="admin-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Succ. →</button>
                </div>
              )}
            </>
          )}
    </div>
  );
}
