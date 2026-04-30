import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [regione, setRegione] = useState('');
  const [provincia, setProvincia] = useState('');
  const [comune, setComune] = useState('');
  const [stageRef, setStageRef] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState(null);
  const [facets, setFacets] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getFacets().then(setFacets).catch(() => {});
    api.getStages().then(setStages).catch(() => {});
  }, []);

  const doSearch = useCallback(async (overridePage) => {
    setLoading(true);
    try {
      const data = await api.search({ q, regione, provincia, comune, stage_ref: stageRef, page: overridePage ?? page });
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, regione, provincia, comune, stageRef, page]);

  useEffect(() => { doSearch(); }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setPage(1);
    doSearch(1);
  }

  function changePage(p) {
    setPage(p);
    doSearch(p);
    window.scrollTo(0, 0);
  }

  const totalPages = results ? Math.ceil(results.total / results.page_size) : 0;

  return (
    <div className="search-page">
      <h1>Cerca foto</h1>
      <form onSubmit={handleSubmit}>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Cerca per titolo, descrizione, autore, tappa…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Cerca</button>
        </div>
        <div className="filters">
          <select value={regione} onChange={(e) => { setRegione(e.target.value); setPage(1); }}>
            <option value="">Tutte le regioni</option>
            {facets?.regioni?.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={provincia} onChange={(e) => { setProvincia(e.target.value); setPage(1); }}>
            <option value="">Tutte le province</option>
            {facets?.province?.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={comune} onChange={(e) => { setComune(e.target.value); setPage(1); }}>
            <option value="">Tutti i comuni</option>
            {facets?.comuni?.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={stageRef} onChange={(e) => { setStageRef(e.target.value); setPage(1); }}>
            <option value="">Tutte le tappe</option>
            {stages.map((s) => <option key={s.id} value={s.sicai_ref}>{s.sicai_ref}</option>)}
          </select>
        </div>
      </form>

      {loading && <p style={{ color: '#888', fontSize: 13 }}>Caricamento…</p>}

      {results && !loading && (
        <>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            {results.total} risultat{results.total === 1 ? 'o' : 'i'}
          </p>
          {results.items.length === 0 ? (
            <div className="empty-state">
              <p>Nessuna foto trovata.<br />Prova con termini diversi o rimuovi i filtri.</p>
            </div>
          ) : (
            <div className="results-grid">
              {results.items.map((img) => (
                <PhotoCard key={img.id} img={img} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="pagination">
              {page > 1 && <button onClick={() => changePage(page - 1)}>← Prec.</button>}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button key={p} className={p === page ? 'active' : ''} onClick={() => changePage(p)}>{p}</button>
                ))}
              {page < totalPages && <button onClick={() => changePage(page + 1)}>Succ. →</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PhotoCard({ img }) {
  return (
    <Link to={`/foto/${img.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="photo-card">
        <img src={img.thumb_url} alt={img.titolo} loading="lazy" />
        <div className="photo-card__body">
          <div className="photo-card__title">{img.titolo}</div>
          <div className="photo-card__meta">
            {img.stage_ref && <span>{img.stage_ref} · </span>}
            {img.comune && <span>{img.comune}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
