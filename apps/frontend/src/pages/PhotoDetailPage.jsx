import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function PhotoDetailPage() {
  const { id } = useParams();
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getImage(id).then(setPhoto).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="photo-detail"><p style={{ color: '#c00' }}>Errore: {error}</p><Link to="/">← Torna alla mappa</Link></div>;
  if (!photo) return <div className="photo-detail"><p>Caricamento…</p></div>;

  return (
    <div className="photo-detail">
      <Link to={`/?photo=${photo.id}`} style={{ fontSize: 13, marginBottom: 16, display: 'inline-block' }}>← Torna alla mappa</Link>
      <h1>{photo.titolo}</h1>
      {photo.caption && <p style={{ marginTop: 8, color: '#555', lineHeight: 1.6 }}>{photo.caption}</p>}
      <a href={photo.original_url} target="_blank" rel="noopener noreferrer">
        <img src={photo.medium_url} alt={photo.titolo} style={{ marginTop: 16, width: '100%', borderRadius: 8, cursor: 'zoom-in' }} />
      </a>
      <div className="meta-grid" style={{ marginTop: 20 }}>
        {photo.autore_nome && <div className="meta-item"><label>Autore:</label> {photo.autore_nome}</div>}
        {photo.data_scatto && <div className="meta-item"><label>Data scatto:</label> {new Date(photo.data_scatto).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
        {photo.stage_ref && <div className="meta-item"><label>Tappa SICAI:</label> {photo.stage_ref}</div>}
        {photo.comune && <div className="meta-item"><label>Comune:</label> {photo.comune}</div>}
        {photo.provincia && <div className="meta-item"><label>Provincia:</label> {photo.provincia}</div>}
        {photo.regione && <div className="meta-item"><label>Regione:</label> {photo.regione}</div>}
        {photo.lat && <div className="meta-item"><label>Coordinate:</label> {Number(photo.lat).toFixed(6)}, {Number(photo.lng).toFixed(6)}</div>}
      </div>
    </div>
  );
}
