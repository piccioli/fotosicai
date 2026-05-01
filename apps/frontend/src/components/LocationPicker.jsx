import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const TILE_URL = 'https://api.webmapp.it/tiles/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; CAI &copy; OpenStreetMap';

// Raggio del cerchio di riferimento (in metri), allineato al massimo dalla tappa — VITE_STAGE_MAX_DISTANCE_M nel .env
const POSITION_CIRCLE_RADIUS_M = Number(import.meta.env.VITE_STAGE_MAX_DISTANCE_M) || 5000;

const CIRCLE_STYLE = {
  color: '#1a6bb5',
  weight: 3,
  opacity: 0.9,
  fillColor: '#1a6bb5',
  fillOpacity: 0.16,
  interactive: false,
};

export default function LocationPicker({ initialPosition, onChange }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    if (leafletRef.current) return;

    const map = L.map(mapRef.current, { zoomControl: true }).setView(
      [initialPosition.lat, initialPosition.lng],
      initialPosition.lat === 42.5 ? 6 : 14
    );
    leafletRef.current = map;

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 18 }).addTo(map);

    // SICAI trail overlay
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

    const marker = L.marker([initialPosition.lat, initialPosition.lng], { icon, draggable: true }).addTo(map);
    markerRef.current = marker;

    const circle = L.circle([initialPosition.lat, initialPosition.lng], {
      radius: POSITION_CIRCLE_RADIUS_M,
      ...CIRCLE_STYLE,
    }).addTo(map);
    circleRef.current = circle;

    function moveCircle(lat, lng) {
      circleRef.current.setLatLng([lat, lng]);
    }

    marker.on('drag', (e) => {
      const { lat, lng } = e.target.getLatLng();
      moveCircle(lat, lng);
    });

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      moveCircle(lat, lng);
      onChange({ lat, lng });
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      moveCircle(lat, lng);
      onChange({ lat, lng });
    });

    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  // Update marker and circle if initialPosition changes externally (e.g. GPS detected)
  useEffect(() => {
    if (!markerRef.current) return;
    markerRef.current.setLatLng([initialPosition.lat, initialPosition.lng]);
    circleRef.current?.setLatLng([initialPosition.lat, initialPosition.lng]);
    if (leafletRef.current) {
      leafletRef.current.setView(
        [initialPosition.lat, initialPosition.lng],
        Math.max(leafletRef.current.getZoom(), 12)
      );
    }
  }, [initialPosition.lat, initialPosition.lng]);

  return <div ref={mapRef} className="map-picker" />;
}
