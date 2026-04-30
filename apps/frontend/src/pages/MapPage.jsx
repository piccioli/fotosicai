import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet.markercluster';
import { api } from '../lib/api.js';

const TILE_URL = 'https://api.webmapp.it/tiles/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; CAI &copy; OpenStreetMap';
const GEOJSON_URL = '/DATA/data.geojson';
const MARKER_ZOOM = 12;
const ITALY_CENTER = [42.5, 12.5];
const ITALY_ZOOM = 6;

export default function MapPage() {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const clusterGroup = useRef(null);
  const [showZoomHint, setShowZoomHint] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

    const updateZoomHint = () => setShowZoomHint(map.getZoom() < MARKER_ZOOM);
    map.on('zoomend', updateZoomHint);
    updateZoomHint();

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
      const popup = L.popup({ maxWidth: 260 })
        .setLatLng([img.lat, img.lng])
        .setContent(buildPopupHtml(img))
        .openOn(map);
    });
    cluster.addLayer(marker);
  }

  function buildPopupHtml(img) {
    return `<div class="photo-popup">
      <img src="${img.thumb_url}" alt="${escHtml(img.titolo)}" onclick="window.location='/foto/${img.id}'" />
      <h3>${escHtml(img.titolo)}</h3>
      ${img.stage_ref ? `<p><strong>Tappa:</strong> ${escHtml(img.stage_ref)}</p>` : ''}
      ${img.data_scatto ? `<p>${escHtml(img.data_scatto.slice(0, 10))}</p>` : ''}
      <a href="/foto/${img.id}">Visualizza</a>
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
      {showZoomHint && (
        <div className="map-zoom-hint">Ingrandisci la mappa per vedere le foto</div>
      )}
      <style>{`.thumb-marker{width:44px;height:44px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);background-size:cover;background-position:center;}`}</style>
    </div>
  );
}
