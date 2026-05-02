import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import L from 'leaflet';
import { api } from '../lib/api.js';
import PhotoMeta from '../components/PhotoMeta.jsx';

const TILE_URL = import.meta.env.VITE_TILE_URL || 'https://api.webmapp.it/tiles/{z}/{x}/{y}.png';
const TILE_ATTR = import.meta.env.VITE_TILE_ATTRIBUTION || '&copy; CAI &copy; OpenStreetMap';

function PhotoMap({ lat, lng }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);

  useEffect(() => {
    if (leafletRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true, dragging: true, scrollWheelZoom: true })
      .setView([lat, lng], 13);
    leafletRef.current = map;

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);

    fetch('/DATA/data.geojson')
      .then((r) => r.json())
      .then((geojson) => {
        L.geoJSON(geojson, {
          style: { color: '#cc0000', weight: 3, opacity: 0.8 },
          interactive: false,
        }).addTo(map);
      })
      .catch(() => {});

    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41],
    });
    L.marker([lat, lng], { icon }).addTo(map);

    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  return <div ref={mapRef} className="photo-detail__map" />;
}

export default function PhotoDetailPage() {
  const { id } = useParams();
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getImage(id).then(setPhoto).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="photo-detail"><p style={{ color: '#c00' }}>Errore: {error}</p><Link to="/">← Torna alla mappa</Link></div>;
  if (!photo) return <div className="photo-detail"><p>Caricamento…</p></div>;

  function toFilePart(str) {
    if (!str) return '';
    return str.trim().replace(/[^a-zA-Z0-9À-ÿ\s\-]/g, '').replace(/\s+/g, '_');
  }

  function coordHash(lat, lng) {
    const str = `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16).slice(0, 3).toUpperCase().padStart(3, '0');
  }

  const ext = (photo.original_url || '').match(/\.([a-zA-Z]+)(\?|$)/)?.[1]?.toLowerCase() || 'jpg';
  const hash = (photo.lat != null && photo.lng != null) ? coordHash(photo.lat, photo.lng) : '000';
  const downloadName = `SICAIFoto_${toFilePart(photo.regione)}_${toFilePart(photo.stage_ref)}_${toFilePart(photo.autore_nome)}_${hash}.${ext}`;

  const dataScatto = photo.data_scatto ? new Date(photo.data_scatto) : null;
  const dataLabel = dataScatto && !isNaN(dataScatto)
    ? dataScatto.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : null;
  const luogo = [photo.comune, photo.provincia, photo.regione].filter(Boolean).join(', ') || photo.stage_ref || '';
  const CC_URL = 'https://creativecommons.org/licenses/by/4.0/deed.it';
  const citationPlain = `${photo.autore_nome || 'Autore sconosciuto'}${dataLabel ? ` (${dataLabel})` : ''}. "${photo.titolo || 'Senza titolo'}"${luogo ? `. ${luogo}` : ''}. FotoSICAI — Sentiero Italia CAI. © Club Alpino Italiano. Licenza CC BY 4.0: ${CC_URL}`;

  function handleCopy() {
    navigator.clipboard.writeText(citationPlain).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="photo-detail">
      <Link to={`/?photo=${photo.id}`} style={{ fontSize: 13, marginBottom: 16, display: 'inline-block' }}>← Torna alla mappa</Link>
      <a href={photo.original_url} target="_blank" rel="noopener noreferrer">
        <img src={photo.medium_url} alt={photo.titolo} style={{ marginTop: 12, width: '100%', borderRadius: 8, cursor: 'zoom-in' }} />
      </a>

      {photo.lat != null && photo.lng != null && (
        <PhotoMap lat={photo.lat} lng={photo.lng} />
      )}

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

      {photo.original_url && (
        <div style={{ marginTop: 20 }}>
          <a href={photo.original_url} download={downloadName} className="btn-primary" style={{ display: 'inline-block', padding: '10px 20px', background: '#cc0000', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: 14 }}>
            ⬇ Scarica foto originale
          </a>
        </div>
      )}

      <div className="photo-detail__citation">
        <h3 className="photo-detail__citation-title">Come citare questa foto</h3>
        <p className="photo-detail__citation-text">
          {photo.autore_nome || 'Autore sconosciuto'}{dataLabel ? ` (${dataLabel})` : ''}. &ldquo;{photo.titolo || 'Senza titolo'}&rdquo;{luogo ? `. ${luogo}` : ''}. FotoSICAI — Sentiero Italia CAI. © Club Alpino Italiano.{' '}
          Licenza <a href={CC_URL} target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.
        </p>
        <button className="photo-detail__citation-copy" onClick={handleCopy}>
          {copied ? '✓ Copiato!' : 'Copia citazione'}
        </button>
      </div>
    </div>
  );
}
