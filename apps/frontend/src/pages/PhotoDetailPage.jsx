import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import PhotoMeta from '../components/PhotoMeta.jsx';

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
      <a href={photo.original_url} target="_blank" rel="noopener noreferrer">
        <img src={photo.medium_url} alt={photo.titolo} style={{ marginTop: 12, width: '100%', borderRadius: 8, cursor: 'zoom-in' }} />
      </a>
      <div style={{ marginTop: 20 }}>
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
      </div>
    </div>
  );
}
