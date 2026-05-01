import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet.markercluster';
import { api } from '../lib/api.js';

const SICAI_TRACK_BASE = import.meta.env.VITE_SICAI_TRACK_BASE_URL || 'https://sentieroitalia.cai.it/track/si-';
const TILE_URL = import.meta.env.VITE_TILE_URL || 'https://api.webmapp.it/tiles/{z}/{x}/{y}.png';
const TILE_ATTR = import.meta.env.VITE_TILE_ATTRIBUTION || '&copy; CAI &copy; OpenStreetMap';
const GEOJSON_URL = '/DATA/data.geojson';
const ITALY_CENTER = [42.5, 12.5];
const ITALY_ZOOM = 6;

function EmailVerifiedModal({ onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="info-overlay" onClick={onClose}>
      <div className="info-popup" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
        <button className="info-popup__close" onClick={onClose} aria-label="Chiudi">×</button>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 10 }}>Email verificata!</h2>
        <p style={{ fontSize: 14, color: '#333', lineHeight: 1.6, marginBottom: 10 }}>
          Grazie per aver confermato la tua email.
        </p>
        <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 10 }}>
          Le tue foto sono ora in attesa di approvazione da parte del <strong>team SICAI</strong>.
          Non appena approvate, saranno visibili sulla mappa e nell'archivio pubblico.
        </p>
        <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, marginBottom: 20 }}>
          Grazie per il tuo contributo al Sentiero Italia!
        </p>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
          Chiudi
        </button>
      </div>
    </div>
  );
}

export default function MapPage() {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const clusterGroup = useRef(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showVerifiedModal, setShowVerifiedModal] = useState(() => searchParams.get('email_verified') === '1');

  function closeVerifiedModal() {
    setShowVerifiedModal(false);
    navigate('/', { replace: true });
  }

  useEffect(() => {
    if (leafletMap.current) return;

    const map = L.map(mapRef.current, { zoomControl: false, minZoom: 5, maxZoom: 18 })
      .setView(ITALY_CENTER, ITALY_ZOOM);
    leafletMap.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18, minZoom: 5 }).addTo(map);

    // Load SICAI GeoJSON overlay
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((geojson) => {
        L.geoJSON(geojson, { style: { color: '#cc0000', weight: 3, opacity: 0.8 } }).addTo(map);
      })
      .catch(() => {});

    // Marker cluster group
    const cluster = L.markerClusterGroup({ maxClusterRadius: 60, disableClusteringAtZoom: 16 });
    clusterGroup.current = cluster;
    map.addLayer(cluster);

    loadMarkers(map, cluster);

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  async function loadMarkers(map, cluster) {
    try {
      const images = await api.getImages();
      cluster.clearLayers();
      images.forEach((img) => addMarker(img, cluster, map));
    } catch (e) {
      console.error('loadMarkers', e);
    }
  }

  function addMarker(img, cluster, map) {
    const icon = L.divIcon({
      className: '',
      html: `<div class="thumb-marker" style="background-image:url(${img.thumb_url})"></div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const marker = L.marker([img.lat, img.lng], { icon });
    marker.on('click', () => {
      L.popup({ maxWidth: 260 })
        .setLatLng([img.lat, img.lng])
        .setContent(buildPopupHtml(img))
        .openOn(map);
    });
    cluster.addLayer(marker);
  }

  function buildPopupHtml(img) {
    const stageRow = img.stage_ref
      ? `<div class="photo-meta__row"><dt>Tappa SICAI:</dt><dd><a href="${SICAI_TRACK_BASE}${escHtml(img.stage_ref.toLowerCase())}/" target="_blank" rel="noopener noreferrer">[${escHtml(img.stage_ref)}]</a></dd></div>`
      : '';
    const dateRow = img.data_scatto
      ? `<div class="photo-meta__row"><dt>Data dello scatto:</dt><dd>${escHtml(new Date(img.data_scatto).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }))}</dd></div>`
      : '';
    return `<div class="photo-popup">
      <img src="${img.thumb_url}" alt="${escHtml(img.titolo)}" onclick="window.location='/foto/${img.id}'" />
      <dl class="photo-meta" style="margin-bottom:8px">
        <div class="photo-meta__row"><dt>Titolo:</dt><dd>${escHtml(img.titolo)}</dd></div>
        ${stageRow}
        ${dateRow}
      </dl>
      <a href="/foto/${img.id}">Visualizza →</a>
    </div>`;
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Open photo popup if ?photo= param is set
  useEffect(() => {
    const photoId = searchParams.get('photo');
    if (!photoId || !leafletMap.current) return;
    api.getImage(photoId).then((img) => {
      if (!img) return;
      leafletMap.current.setView([img.lat, img.lng], 15);
    }).catch(() => {});
  }, [searchParams]);

  return (
    <div className="map-wrap">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <style>{`.thumb-marker{width:44px;height:44px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);background-size:cover;background-position:center;}`}</style>
      {showVerifiedModal && <EmailVerifiedModal onClose={closeVerifiedModal} />}
    </div>
  );
}
