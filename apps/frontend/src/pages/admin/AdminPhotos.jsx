import React, { useEffect, useState, useRef, useCallback } from 'react';
import { adminApi } from '../../lib/api.js';
import PhotoMeta from '../../components/PhotoMeta.jsx';

const STATUS_LABELS = {
  published: 'Email verificata',
  pending_verification: 'In attesa email',
  draft: 'Bozza',
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
}

/* ── Modal ───────────────────────────────────────────────────────────────── */

function PhotoModal({ id, onClose, onReload }) {
  const [photo, setPhoto] = useState(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    setPhoto(null);
    adminApi.getImage(id).then(setPhoto).catch(() => onClose());
  }, [id, onClose]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleValidate() {
    setActing(true);
    try { await adminApi.validateImage(id); onReload(); onClose(); }
    catch (e) { alert(`Errore: ${e.message}`); setActing(false); }
  }

  async function handleInvalidate() {
    setActing(true);
    try { await adminApi.invalidateImage(id); onReload(); onClose(); }
    catch (e) { alert(`Errore: ${e.message}`); setActing(false); }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal__close" onClick={onClose} aria-label="Chiudi">✕</button>

        {!photo ? (
          <div className="admin-loading" style={{ minHeight: 200 }}>Caricamento…</div>
        ) : (
          <>
            <div className="admin-modal__img-wrap">
              <a href={photo.original_url} target="_blank" rel="noopener noreferrer">
                <img src={photo.medium_url || photo.thumb_url} alt={photo.titolo || ''} className="admin-modal__img" />
              </a>
            </div>

            <div className="admin-modal__body">
              <div className="admin-modal__badges">
                <span className={`admin-badge ${photo.status === 'published' ? 'admin-badge--ok' : photo.status === 'pending_verification' ? 'admin-badge--warn' : 'admin-badge--neutral'}`}>
                  {STATUS_LABELS[photo.status] || photo.status}
                </span>
                {photo.validated_at
                  ? <span className="admin-badge admin-badge--ok" title={`Validata da ${photo.validated_by} il ${fmt(photo.validated_at)}`}>Validata ✓</span>
                  : <span className="admin-badge admin-badge--neutral">Non validata</span>}
              </div>

              <PhotoMeta
                titolo={photo.titolo}
                caption={photo.caption}
                autoreName={photo.autore_nome}
                dataScatto={photo.data_scatto}
                stageRef={photo.stage_ref}
                distanceM={photo.stage_distance_m}
                lat={photo.lat}
                lng={photo.lng}
                regione={photo.regione}
                provincia={photo.provincia}
                comune={photo.comune}
                socioCai={!!photo.socio_cai}
                sezioneCai={photo.sezione_cai}
                ruoloCai={photo.ruolo_cai}
                referenteSicai={!!photo.referente_sicai}
                referenteSicaiAmbito={photo.referente_sicai_ambito}
              />

              <p style={{ fontSize: 12, color: '#888', marginTop: 12 }}>
                Email: {photo.email || '—'} · Caricata: {fmt(photo.created_at)}
              </p>

              <div className="admin-modal__actions">
                {photo.status === 'published' && !photo.validated_at && (
                  <button className="admin-btn admin-btn--success" onClick={handleValidate} disabled={acting}>
                    {acting ? '…' : 'Valida'}
                  </button>
                )}
                {photo.validated_at && (
                  <button className="admin-btn" onClick={handleInvalidate} disabled={acting}>
                    {acting ? '…' : 'Revoca validazione'}
                  </button>
                )}
                <button className="admin-btn" onClick={onClose}>Chiudi</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

export default function AdminPhotos() {
  const [data, setData]         = useState(null);
  const [facets, setFacets]     = useState({ stage_refs: [], regioni: [] });
  const [status, setStatus]     = useState('all');
  const [validated, setVal]     = useState('all');
  const [q, setQ]               = useState('');
  const [email, setEmail]       = useState('');
  const [stageRef, setStageRef] = useState('all');
  const [regione, setRegione]   = useState('all');
  const [page, setPage]         = useState(1);
  const [error, setError]       = useState('');
  const [acting, setActing]     = useState(null);
  const [modalId, setModalId]   = useState(null);
  const debQ    = useRef(null);
  const debMail = useRef(null);

  useEffect(() => {
    adminApi.facets().then(setFacets).catch(() => {});
  }, []);

  const load = useCallback((opts) => {
    setError('');
    adminApi.images(opts).then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load({ status, validated, q, email, stage_ref: stageRef, regione, page });
  }, [status, validated, stageRef, regione, page]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetPage(cb) { setPage(1); cb(); }

  function handleDiscreteChange(setter, val) {
    resetPage(() => setter(val));
  }

  function handleQChange(e) {
    const val = e.target.value; setQ(val);
    clearTimeout(debQ.current);
    debQ.current = setTimeout(() => { setPage(1); load({ status, validated, q: val, email, stage_ref: stageRef, regione, page: 1 }); }, 400);
  }

  function handleEmailChange(e) {
    const val = e.target.value; setEmail(val);
    clearTimeout(debMail.current);
    debMail.current = setTimeout(() => { setPage(1); load({ status, validated, q, email: val, stage_ref: stageRef, regione, page: 1 }); }, 400);
  }

  async function handleValidate(id) {
    setActing(id);
    try { await adminApi.validateImage(id); load({ status, validated, q, email, stage_ref: stageRef, regione, page }); }
    catch (e) { alert(`Errore: ${e.message}`); }
    finally { setActing(null); }
  }

  async function handleInvalidate(id) {
    setActing(id);
    try { await adminApi.invalidateImage(id); load({ status, validated, q, email, stage_ref: stageRef, regione, page }); }
    catch (e) { alert(`Errore: ${e.message}`); }
    finally { setActing(null); }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Eliminare la foto "${title || id}"? Questa azione è irreversibile.`)) return;
    setActing(id);
    try { await adminApi.deleteImage(id); load({ status, validated, q, email, stage_ref: stageRef, regione, page }); }
    catch (e) { alert(`Errore: ${e.message}`); }
    finally { setActing(null); }
  }

  const reloadCurrent = useCallback(() => {
    load({ status, validated, q, email, stage_ref: stageRef, regione, page });
  }, [load, status, validated, q, email, stageRef, regione, page]);

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  return (
    <div>
      {modalId && (
        <PhotoModal
          id={modalId}
          onClose={() => setModalId(null)}
          onReload={reloadCurrent}
        />
      )}

      <h2 className="admin-page-title">Foto {data ? `(${data.total})` : ''}</h2>

      <div className="admin-filters-grid">
        <label className="admin-filter-label">
          <span>Stato email</span>
          <select value={status} onChange={(e) => handleDiscreteChange(setStatus, e.target.value)} className="admin-select">
            <option value="all">Tutti</option>
            <option value="pending_validation">Email verif. + non validate</option>
            <option value="published">Email verificata</option>
            <option value="pending_verification">In attesa email</option>
            <option value="draft">Bozza</option>
          </select>
        </label>

        <label className="admin-filter-label">
          <span>Validazione admin</span>
          <select value={validated} onChange={(e) => handleDiscreteChange(setVal, e.target.value)} className="admin-select">
            <option value="all">Tutte</option>
            <option value="false">Non validate</option>
            <option value="true">Validate</option>
          </select>
        </label>

        <label className="admin-filter-label">
          <span>Tappa</span>
          <select value={stageRef} onChange={(e) => handleDiscreteChange(setStageRef, e.target.value)} className="admin-select">
            <option value="all">Tutte le tappe</option>
            {facets.stage_refs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>

        <label className="admin-filter-label">
          <span>Regione</span>
          <select value={regione} onChange={(e) => handleDiscreteChange(setRegione, e.target.value)} className="admin-select">
            <option value="all">Tutte le regioni</option>
            {facets.regioni.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>

        <label className="admin-filter-label">
          <span>Cerca titolo / autore</span>
          <input type="search" placeholder="Titolo, autore…" value={q} onChange={handleQChange} className="admin-search" />
        </label>

        <label className="admin-filter-label">
          <span>Cerca email</span>
          <input type="search" placeholder="nome@esempio.it" value={email} onChange={handleEmailChange} className="admin-search" />
        </label>
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
                      <th>Stato email</th>
                      <th>Validata</th>
                      <th>Data</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((img) => (
                      <tr key={img.id}>
                        <td>
                          <button
                            className="admin-thumb-btn"
                            onClick={() => setModalId(img.id)}
                            title="Apri dettaglio"
                          >
                            {img.thumb_url
                              ? <img src={img.thumb_url} alt="" className="admin-thumb" />
                              : <div className="admin-thumb admin-thumb--empty" />}
                          </button>
                        </td>
                        <td>
                          {img.status === 'published' && img.validated_at
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
                        <td style={{ textAlign: 'center' }}>
                          {img.validated_at
                            ? <span className="admin-badge admin-badge--ok" title={`Validata da ${img.validated_by} il ${fmt(img.validated_at)}`}>Sì</span>
                            : <span className="admin-badge admin-badge--neutral">No</span>}
                        </td>
                        <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmt(img.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                            {img.status === 'published' && !img.validated_at && (
                              <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => handleValidate(img.id)} disabled={acting === img.id}>
                                {acting === img.id ? '…' : 'Valida'}
                              </button>
                            )}
                            {img.validated_at && (
                              <button className="admin-btn admin-btn--sm" onClick={() => handleInvalidate(img.id)} disabled={acting === img.id}>
                                {acting === img.id ? '…' : 'Revoca'}
                              </button>
                            )}
                            <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => handleDelete(img.id, img.titolo)} disabled={acting === img.id}>
                              {acting === img.id ? '…' : 'Elimina'}
                            </button>
                          </div>
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
